[votex_servers]
votex-server ansible_host=${server_ip} ansible_user=ubuntu ansible_ssh_private_key_file=${private_key_path} ansible_python_interpreter=/usr/bin/python3

[votex_servers:vars]
ansible_ssh_common_args='-o StrictHostKeyChecking=no'