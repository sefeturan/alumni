const path = require('path');
const swaggerUi = require('swagger-ui-express');

/**
 * OpenAPI 3.0 Specification for Alumni Network Platform
 * Documents both RESTful API (/api/users) and Web/MVC (/users) routes
 */
const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Alumni Network Platform API',
    version: '1.0.0',
    description: 'Interactive API documentation for Alumni Network backend, including MVC Web routes and RESTful JSON API endpoints.'
  },
  servers: [
    {
      url: '/',
      description: 'Current Environment'
    }
  ],
  tags: [
    {
      name: 'API Users (/api/users)',
      description: 'RESTful JSON API operations for Users (handled by ApiUserController)'
    },
    {
      name: 'Web Users (/users)',
      description: 'Traditional MVC Web endpoints for Users (handled by UserController)'
    },
    {
      name: 'Genel & Sağlık (General)',
      description: 'Genel sistem ve durum kontrol endpointleri'
    }
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['Genel & Sağlık (General)'],
        summary: 'Sistem Sağlık Kontrolü (Detaylı)',
        description: 'Sunucu çalışma süresi, durumu ve zaman damgasını döner.',
        responses: {
          200: {
            description: 'Sistem sorunsuz çalışıyor'
          }
        }
      }
    },
    '/health': {
      get: {
        tags: ['Genel & Sağlık (General)'],
        summary: 'Sağlık Kontrolü (Hafif)',
        responses: {
          200: {
            description: 'Durum OK'
          }
        }
      }
    },

    // ==========================================
    // REST API ENDPOINTS: /api/users
    // ==========================================
    '/api/users': {
      get: {
        tags: ['API Users (/api/users)'],
        summary: 'Get all users',
        description: 'Returns a list of all users. Supports filtering by role, department, company, etc. via query parameters.',
        parameters: [
          {
            name: 'role',
            in: 'query',
            description: 'Filter by role (e.g. alumni, student, admin)',
            schema: { type: 'string', example: 'alumni' }
          },
          {
            name: 'department',
            in: 'query',
            description: 'Filter by academic department',
            schema: { type: 'string', example: 'Computer Science' }
          },
          {
            name: 'company',
            in: 'query',
            description: 'Filter by current company',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'List of users retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    count: { type: 'integer', example: 2 },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/User' }
                    }
                  }
                }
              }
            }
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      post: {
        tags: ['API Users (/api/users)'],
        summary: 'Create a new user',
        description: 'Registers a new user in memory. Email must be unique.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserInput' }
            }
          }
        },
        responses: {
          201: {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'User created successfully.' },
                    data: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          400: {
            description: 'Validation error (missing name or email)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          409: {
            description: 'Email already exists',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/users/{id}': {
      get: {
        tags: ['API Users (/api/users)'],
        summary: 'Get user by ID',
        description: 'Returns the profile of a single user.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Unique User UUID',
            schema: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' }
          }
        ],
        responses: {
          200: {
            description: 'User found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          404: {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      put: {
        tags: ['API Users (/api/users)'],
        summary: 'Update user by ID',
        description: 'Updates properties of an existing user.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Unique User UUID',
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserUpdateInput' }
            }
          }
        },
        responses: {
          200: {
            description: 'User updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'User updated successfully.' },
                    data: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          404: {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          409: {
            description: 'Email conflict with another user',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      },
      patch: {
        tags: ['API Users (/api/users)'],
        summary: 'Partially update user by ID',
        description: 'Updates specified fields of an existing user.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Unique User UUID',
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserUpdateInput' }
            }
          }
        },
        responses: {
          200: {
            description: 'User updated successfully'
          },
          404: {
            description: 'User not found'
          }
        }
      },
      delete: {
        tags: ['API Users (/api/users)'],
        summary: 'Delete user by ID',
        description: 'Deletes a user from memory.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Unique User UUID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'User deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'User deleted successfully.' },
                    data: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          404: {
            description: 'User not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },

    // ==========================================
    // WEB / MVC ENDPOINTS: /users
    // ==========================================
    '/users': {
      get: {
        tags: ['Web Users (/users)'],
        summary: 'List users (HTML View)',
        description: 'Renders an HTML table listing all registered users.',
        responses: {
          200: {
            description: 'HTML page showing users list',
            content: {
              'text/html': {
                schema: { type: 'string' }
              }
            }
          }
        }
      },
      post: {
        tags: ['Web Users (/users)'],
        summary: 'Create user via web form',
        description: 'Processes form submission, creates user, and redirects to users list.',
        requestBody: {
          required: true,
          content: {
            'application/x-www-form-urlencoded': {
              schema: { $ref: '#/components/schemas/UserInput' }
            },
            'application/json': {
              schema: { $ref: '#/components/schemas/UserInput' }
            }
          }
        },
        responses: {
          302: {
            description: 'Redirects to /users'
          },
          400: {
            description: 'Creation failed (HTML error view)'
          }
        }
      }
    },
    '/users/{id}': {
      get: {
        tags: ['Web Users (/users)'],
        summary: 'View user profile (HTML View)',
        description: 'Renders the detailed profile card of a specific user.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'User UUID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'HTML page showing user profile',
            content: {
              'text/html': {
                schema: { type: 'string' }
              }
            }
          },
          404: {
            description: 'User not found page'
          }
        }
      }
    },
    '/users/{id}/edit': {
      get: {
        tags: ['Web Users (/users)'],
        summary: 'View user edit form (HTML View)',
        description: 'Renders the edit form pre-filled with the user data.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'User UUID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'HTML page showing user edit form',
            content: {
              'text/html': {
                schema: { type: 'string' }
              }
            }
          },
          404: {
            description: 'User not found'
          }
        }
      }
    },
    '/users/{id}/update': {
      post: {
        tags: ['Web Users (/users)'],
        summary: 'Update user via web form',
        description: 'Processes user edit form and redirects to /users/{id}.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/x-www-form-urlencoded': {
              schema: { $ref: '#/components/schemas/UserUpdateInput' }
            }
          }
        },
        responses: {
          302: {
            description: 'Redirects to /users/{id}'
          }
        }
      }
    },
    '/users/{id}/delete': {
      post: {
        tags: ['Web Users (/users)'],
        summary: 'Delete user via web action',
        description: 'Deletes user and redirects to /users.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          302: {
            description: 'Redirects to /users'
          }
        }
      }
    }
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'd89c9df4-6d9b-43a0-8a45-6cfbf18b32e1' },
          name: { type: 'string', example: 'Ahmet Yılmaz' },
          email: { type: 'string', format: 'email', example: 'ahmet@example.com' },
          role: { type: 'string', enum: ['student', 'alumni', 'admin'], example: 'alumni' },
          graduationYear: { type: 'integer', example: 2022 },
          department: { type: 'string', example: 'Computer Science' },
          company: { type: 'string', example: 'Tech Corp' },
          title: { type: 'string', example: 'Software Engineer' },
          skills: {
            type: 'array',
            items: { type: 'string' },
            example: ['JavaScript', 'Node.js', 'React']
          },
          bio: { type: 'string', example: 'Full-stack software engineer interested in distributed systems.' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      UserInput: {
        type: 'object',
        required: ['name', 'email'],
        properties: {
          name: { type: 'string', example: 'Ayşe Demir' },
          email: { type: 'string', format: 'email', example: 'ayse@example.com' },
          password: { type: 'string', example: 'secret123' },
          role: { type: 'string', enum: ['student', 'alumni', 'admin'], default: 'alumni' },
          graduationYear: { type: 'integer', example: 2023 },
          department: { type: 'string', example: 'Industrial Engineering' },
          company: { type: 'string', example: 'Global Logistics' },
          title: { type: 'string', example: 'Product Manager' },
          skills: {
            type: 'array',
            items: { type: 'string' },
            example: ['Product Management', 'Agile', 'Data Analysis']
          },
          bio: { type: 'string', example: 'Connecting graduates and mentoring young professionals.' }
        }
      },
      UserUpdateInput: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['student', 'alumni', 'admin'] },
          graduationYear: { type: 'integer' },
          department: { type: 'string' },
          company: { type: 'string' },
          title: { type: 'string' },
          skills: { type: 'array', items: { type: 'string' } },
          bio: { type: 'string' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'An error occurred.' },
          error: { type: 'string' }
        }
      }
    }
  }
};

function setupSwagger(app) {
  // Swagger UI mount at both /api-docs and /api/swagger
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use('/api/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Alumni Network - Swagger API Docs',
    customCss: '.swagger-ui .topbar { display: flex; background-color: #1e3a8a; }'
  }));

  app.get(['/swagger.json', '/api/swagger.json'], (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerSpec);
  });
}

module.exports = {
  swaggerUi,
  swaggerSpec,
  setupSwagger
};
