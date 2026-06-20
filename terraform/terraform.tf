terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
  backend "s3" {
    bucket = "my-remote-bucket-69"
    region = "us-east-1"
    key = "terraform.tfstate"
    dynamodb_table = "my-remote-db-table-69"
    
  }
}