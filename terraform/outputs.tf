output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.votex_server.id
}

output "instance_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_eip.votex_eip.public_ip
}

output "instance_public_dns" {
  description = "Public DNS of the EC2 instance"
  value       = aws_instance.votex_server.public_dns
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.votex_sg.id
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i ${local_file.private_key.filename} ubuntu@${aws_eip.votex_eip.public_ip}"
}

output "key_pair_name" {
  description = "Name of the SSH key pair"
  value       = aws_key_pair.votex_key.key_name
}