#!/bin/bash

aws cloudformation $ACTION \
    --region us-east-1 \
    --stack-name $STACK_NAME \
    --template-body file://service.yaml \
    --capabilities CAPABILITY_NAMED_IAM \
    --parameters \
    ParameterKey=DockerImage,ParameterValue=805495149875.dkr.ecr.us-east-1.amazonaws.com/apollo:$(git rev-parse HEAD) \
    ParameterKey=VPC,ParameterValue=vpc-9a4a99e0 \
    ParameterKey=Cluster,ParameterValue=apollo \
    ParameterKey=Listener,ParameterValue=arn:aws:elasticloadbalancing:us-east-1:805495149875:listener/app/apollo-production/e1bca4d22ce8d95f/c3bef7574036ce47
