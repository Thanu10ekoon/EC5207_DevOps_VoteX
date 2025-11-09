#!/bin/bash

cd ~/votex-project/terraform
EC2_IP=$(terraform output -raw instance_public_ip)
KEY_PATH=~/votex-project/terraform/votex-key.pem

cd ~/votex-project/ansible

cat > inventory.ini << EOF
[votex_servers]
votex-server ansible_host=${EC2_IP} ansible_user=ubuntu ansible_ssh_private_key_file=${KEY_PATH} ansible_python_interpreter=/usr/bin/python3

[votex_servers:vars]
ansible_ssh_common_args='-o StrictHostKeyChecking=no'
EOF

echo "Inventory file created with IP: ${EC2_IP}"
cat inventory.ini