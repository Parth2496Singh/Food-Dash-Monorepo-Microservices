resource aws_s3_bucket my-remote-buckets {
    bucket = "my-remote-bucket-69"
    force_destroy = true
    tags = {
        name = "my-remote-bucket-69"
    }
}