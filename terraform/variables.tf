variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro" # Changed from t2.micro - Free tier eligible
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "votex"
}