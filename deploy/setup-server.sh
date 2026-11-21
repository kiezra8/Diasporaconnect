#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Diaspora Connect — one-time setup of a fresh Contabo VPS (Ubuntu 22.04 / 24.04)
#
#  Run as root on the new server:
#     curl -fsSL https://raw.githubusercontent.com/kiezra8/Diasporaconnect/main/deploy/setup-server.sh -o setup-server.sh
#     bash setup-server.sh
#
#  What it does: updates Ubuntu, adds swap, installs Docker, turns on the firewall
#  (only SSH, HTTP, HTTPS open), blocks repeated SSH password guessing, creates a
#  `deploy` user, and downloads the app to /opt/diaspora-connect.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/kiezra8/Diasporaconnect.git}"
APP_DIR="/opt/diaspora-connect"
APP_USER="deploy"

if [ "$(id -u)" -ne 0 ]; then echo "Run this as root (ssh root@<server-ip>)."; exit 1; fi

echo "==> Updating Ubuntu"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y ca-certificates curl git ufw fail2ban unattended-upgrades
dpkg-reconfigure -f noninteractive unattended-upgrades || true
timedatectl set-timezone Africa/Kampala || true

echo "==> Swap (helps the portal build on small plans)"
if ! swapon --show | grep -q .; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker

echo "==> Firewall: SSH, HTTP, HTTPS only"
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

echo "==> Block repeated SSH login failures"
systemctl enable --now fail2ban

echo "==> User '${APP_USER}'"
if ! id "${APP_USER}" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "${APP_USER}"
fi
usermod -aG docker,sudo "${APP_USER}"
if [ -f /root/.ssh/authorized_keys ]; then
  mkdir -p "/home/${APP_USER}/.ssh"
  cp /root/.ssh/authorized_keys "/home/${APP_USER}/.ssh/authorized_keys"
  chown -R "${APP_USER}:${APP_USER}" "/home/${APP_USER}/.ssh"
  chmod 700 "/home/${APP_USER}/.ssh"
  chmod 600 "/home/${APP_USER}/.ssh/authorized_keys"
fi

echo "==> SSH: keys only (when an SSH key is installed)"
if [ -s /root/.ssh/authorized_keys ]; then
  mkdir -p /etc/ssh/sshd_config.d
  cat > /etc/ssh/sshd_config.d/10-diaspora-hardening.conf <<'SSHCONF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
MaxAuthTries 4
SSHCONF
  systemctl reload ssh 2>/dev/null || systemctl reload sshd 2>/dev/null || true
  echo "    Password logins are now off; use your SSH key."
else
  echo "    No SSH key found for root, so password login stays on."
  echo "    Add a key (ssh-copy-id root@<server-ip>) and run this script again to turn passwords off."
fi

echo "==> App code in ${APP_DIR}"
if [ ! -d "${APP_DIR}/.git" ]; then
  git clone "${REPO_URL}" "${APP_DIR}"
fi
chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"
if [ ! -f "${APP_DIR}/backend/.env" ]; then
  cp "${APP_DIR}/backend/.env.example" "${APP_DIR}/backend/.env"
  chown "${APP_USER}:${APP_USER}" "${APP_DIR}/backend/.env"
  chmod 600 "${APP_DIR}/backend/.env"
fi

IP=$(curl -fsS -4 https://ifconfig.me || hostname -I | awk '{print $1}')
cat <<EOF

────────────────────────────────────────────────────────────
 Server ready.  IP address: ${IP}

 Next:
  1. At your domain registrar, add A records pointing to ${IP}:
       diasporaconnectt.com, www.diasporaconnectt.com, api.diasporaconnectt.com
  2. Put your keys in the server settings file:
       nano ${APP_DIR}/backend/.env
     (at least SUPABASE_SERVICE_ROLE_KEY)
  3. Start the app as the deploy user:
       su - ${APP_USER}
       cd ${APP_DIR} && bash deploy/deploy.sh
────────────────────────────────────────────────────────────
EOF
