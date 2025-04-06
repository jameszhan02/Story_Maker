import swaggerJsdoc from 'swagger-jsdoc'

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Story Maker API',
      version: '1.0.0',
      description: 'API documentation for Story Maker',
      contact: {
        name: 'API Support',
        email: 'your.email@example.com',
      },
    },
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'auth_token',
        },
      },
    },
    security: [
      {
        cookieAuth: [],
      },
    ],
  },
  apis: ['./src/services/**/*.ts', './src/docs/swaggerTypes.ts'], // 路径根据你的项目结构调整
}

export const swaggerSpec = swaggerJsdoc(swaggerOptions)
