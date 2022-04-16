const AWS = require("aws-sdk");
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
    const TABLE= 'User'
    let body;
    let statusCode = 200;
    const headers = {
        "Content-Type": "application/json"
    };

    const path = event.resource;
    const httpMethod = event.httpMethod;

    try {
        switch (path) {
            case "/user":
                switch (httpMethod) {
                    case "GET":
                        body = await dynamoDb.scan({TableName: TABLE}).promise();
                        break;
                    case "POST":
                        const requestJSON = JSON.parse(event.body);
                        await dynamoDb.put({
                                TableName: TABLE,
                                Item: {
                                    id: requestJSON.id,
                                    name: requestJSON.name,
                                    address:requestJSON.address,
                                }
                            }).promise();
                        body = {"result": `Upsert item ${requestJSON.id}`};
                        break;
                    default:
                        throw new Error(`Unsupported http method "${httpMethod}" on "${path}"`);
                }
                break;
            case "/user/{id}":
                switch (httpMethod) {
                    case "GET":
                        body = await dynamoDb.get({
                                TableName: TABLE,
                                Key: {
                                    id: event.pathParameters.id
                                }
                            }).promise();
                        if ('Item' in body) {
                            body = body['Item']
                        }
                        break;
                    case "DELETE":
                        await dynamoDb.delete({
                                TableName: TABLE,
                                Key: {
                                    id: event.pathParameters.id
                                }
                            }).promise();
                        body = {"result": `Deleted item ${event.pathParameters.id}`};
                        break;
                    default:
                        throw new Error(`Unsupported http method "${httpMethod}" on "${path}"`);
                }
                break;
            default:
                throw new Error(`Unsupported operation: "${path}"`);
        }
    } catch (err) {
        console.log(err)
        statusCode = 400;
        body = err.message;
    } finally {
        console.log(body)
        body = JSON.stringify(body);
    }

    return {
        statusCode,
        body,
        headers
    };
};