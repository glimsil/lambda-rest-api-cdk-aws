import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { PolicyDocument, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { LambdaIntegration, ResourceBase, RestApi } from "aws-cdk-lib/aws-apigateway";
import { userApiDefinition, ApiDefinition } from './api-definition';
import * as path from "path";

export class InfraStack extends Stack {

  private readonly resourcePrefix: string;
  private userTable: Table;
  private userLambda: Function;
  private userLambdaRole: Role;
  private userApi: RestApi;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    this.resourcePrefix = "TestUserApi"
    this.userTable = this.createUserTable(); // create user table
    this.userLambdaRole = this.createUserLambdaRole(); // create IAM role for lambda
    this.userLambda = this.createUserLambda(); // create user lambda
    this.userApi = this.createUserApi(); // create api gateway rest api mapping to labmda
    this.addApiResources(); // adding rest resources to api gateway
    new CfnOutput(this, 'apiUrl', {value: this.userApi.url}); // output api endpoint
  }

  private createUserTable(): Table {
    return new Table(this, `${this.resourcePrefix}-UserTable`, {
        tableName: 'User',
        partitionKey: {
            name: 'id',
            type: AttributeType.STRING
        },
    });
  }

  private createUserLambda(): Function {
    return new Function(this, `${this.resourcePrefix}-UserLambda`, {
      code: Code.fromAsset(path.join(__dirname, '../../lambda')),
      handler: "userLambda.handler",
      role: this.userLambdaRole,
      runtime: Runtime.NODEJS_14_X
    });
  }

  private createUserLambdaRole(): Role {
    // Policies to give lambda permissions to use DynamoDB UserTable
    const accessDdb = new PolicyDocument({
      statements: [
        new PolicyStatement({
          actions: [
              "dynamodb:BatchGetItem",
              "dynamodb:GetItem",
              "dynamodb:Scan",
              "dynamodb:Query",
              "dynamodb:BatchWriteItem",
              "dynamodb:PutItem",
              "dynamodb:UpdateItem",
              "dynamodb:DeleteItem"
          ],
          resources: [this.userTable.tableArn] // only userTable
        }),
      ],
    });
    return new Role(this, `${this.resourcePrefix}-UserLambdaRole`, {
      roleName: 'UserLambdaRole',
      description: 'IAM role for UserLambdaRole',
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        AccessDdb: accessDdb // add inline policy to IAM Role
      }
    });
  }

  private createUserApi(): RestApi {
    return new RestApi(this, `${this.resourcePrefix}-UserApi`, {
        description: 'User API',
        deployOptions: {
            stageName: 'test'
        },
        defaultCorsPreflightOptions: {
            allowHeaders: [
                'Content-Type',
                'X-Amz-Date',
                'Authorization',
                'X-Api-Key',
            ],
            allowMethods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
            allowCredentials: true,
            allowOrigins: ['*'],
        },
    });
  }

  private addApiResources() {
    const resource = this.userApi.root.addResource(userApiDefinition.path);
    this.addApiResource(userApiDefinition, resource);
  }

  private addApiResource(apiDefinition: ApiDefinition, resource: ResourceBase) {
    apiDefinition.methods.forEach(method => {
      resource.addMethod(method, new LambdaIntegration(this.userLambda));
    });
    apiDefinition.child.forEach(child => {
      this.addApiResource(child, resource.addResource(child.path))
    });
  }
}
