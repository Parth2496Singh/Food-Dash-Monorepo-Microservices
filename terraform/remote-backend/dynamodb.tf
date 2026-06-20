resource "aws_dynamodb_table" "basic-dynamodb-table" {
  name           = "my-remote-db-table-69"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "LockID"

  attribute {
    name = "LockID"
    type = "S" # S=string
  }
  tags = {
    Name        = "my-remote-db-table-69"
  }
}