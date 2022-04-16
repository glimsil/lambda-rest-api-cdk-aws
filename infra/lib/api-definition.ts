type ApiDefinition = {
    path: string;
    child: ApiDefinition[];
    methods: string[];
};

const userApiDefinition: ApiDefinition = {
    path: 'user',
    child : [
        {
            path: '{id}',
            child : [],
            methods: [
                'GET', 'DELETE'
            ]
        }
    ],
    methods: [
        'GET', 'POST'
    ]
};

export { ApiDefinition, userApiDefinition };