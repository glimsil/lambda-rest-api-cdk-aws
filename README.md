# lambda-rest-api-cdk-aws
This is an example on how to create and deploy an api using lambda + api gateway integration using CDK.

Requirements:
 - Node.js
 - CDK
 - AWS CLI

# Setup
First, setup you aws environment running:

```
aws configure
```
You should set up your User Access Key / Secret and region.

# Deploying
In the first time you should run:

```
cdk bootstrap # You only have to run it once
```   

Build and compile the TS infra component on `infra` folder, running:
```
npm run build
```   

To deploy the api run (on `infra` folder):
```
cdk deploy --require-approval never
```

The rest api endpoint will be outputed after deployment. The outputformat would be something like:

```
InfraStack.apiUrl = https://xxxxxxxxxx.execute-api.us-west-2.amazonaws.com/test/
```

To destroy the stack, run:

```
cdk destroy
```