const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Alumni Network - REST API Dokümantasyonu (Swagger)',
      version: '1.0.0',
      description: 'Alumni Platformu için hazırlanan tüm RESTful API uç noktalarının (GET, POST, PUT, PATCH, DELETE) interaktif dokümantasyonu ve test paneli.',
      contact: {
        name: 'Alumni Dev Team'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Yerel Sunucu (Localhost)'
      }
    ],
    tags: [
      {
        name: 'Kullanıcılar (Users)',
        description: 'Kullanıcı kayıt, listeleme, güncelleme ve silme işlemleri'
      },
      {
        name: 'Sistem & Sağlık (Health)',
        description: 'Sunucu çalışma durumu ve sağlık kontrolleri'
      },
      {
        name: 'Yardımcı & Örnek Uç Noktalar',
        description: 'Hello ve Toplama (Sum) servisleri'
      }
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Sefe Turan' },
            email: { type: 'string', example: 'sefe@example.com' },
            role: { type: 'string', example: 'Alumni' },
            department: { type: 'string', example: 'Yazılım Mühendisliği' },
            graduationYear: { type: 'integer', example: 2024 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        UserInput: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            name: { type: 'string', example: 'Sefe Turan' },
            email: { type: 'string', example: 'sefe@example.com' },
            department: { type: 'string', example: 'Yazılım Mühendisliği' },
            graduationYear: { type: 'integer', example: 2024 },
            unvan: { type: 'string', example: 'Full Stack Developer' },
            sehir: { type: 'string', example: 'İstanbul' }
          }
        },
        UserUpdateInput: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Sefe Turan' },
            email: { type: 'string', example: 'sefe.guncel@example.com' },
            department: { type: 'string', example: 'Yapay Zeka Mühendisliği' },
            graduationYear: { type: 'integer', example: 2025 },
            unvan: { type: 'string', example: 'Lead AI Engineer' },
            sehir: { type: 'string', example: 'Ankara' }
          }
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            message: { type: 'string', example: 'Alumni Network API is healthy and running' },
            timestamp: { type: 'string', example: '2026-09-30T07:45:00.000Z' },
            uptime: { type: 'number', example: 142.3 }
          }
        }
      }
    },
    paths: {
      '/api/health': {
        get: {
          tags: ['Sistem & Sağlık (Health)'],
          summary: 'API Sağlık Kontrolü (JSON)',
          description: 'Sistemin ayakta olup olmadığını ve çalışma süresini JSON formatında döner.',
          responses: {
            200: {
              description: 'Sistem çalışıyor',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/HealthResponse' }
                }
              }
            }
          }
        }
      },
      '/health': {
        get: {
          tags: ['Sistem & Sağlık (Health)'],
          summary: 'Temel Sağlık Kontrolü',
          description: 'status: ok döndüren basit kontrol.',
          responses: {
            200: {
              description: 'OK'
            }
          }
        }
      },
      '/api/users': {
        get: {
          tags: ['Kullanıcılar (Users)'],
          summary: 'Tüm Kullanıcıları Listele (GET)',
          description: 'Kalıcı JSON deposundaki tüm kayıtlı kullanıcıları ve toplam sayıyı getirir.',
          responses: {
            200: {
              description: 'Başarılı',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      count: { type: 'integer', example: 3 },
                      users: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/User' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          tags: ['Kullanıcılar (Users)'],
          summary: 'Yeni Kullanıcı Kaydet (POST)',
          description: 'İstemciden gönderilen verileri alır, otomatik ID ve tarih ekleyerek users.json dosyasına kaydeder.',
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
              description: 'Kullanıcı oluşturuldu',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      message: { type: 'string', example: 'Kullanıcı başarıyla kaydedildi' },
                      user: { $ref: '#/components/schemas/User' }
                    }
                  }
                }
              }
            },
            400: {
              description: 'Eksik veya geçersiz veri'
            }
          }
        }
      },
      '/api/users/{id}': {
        patch: {
          tags: ['Kullanıcılar (Users)'],
          summary: 'Kullanıcı Güncelle (PATCH - Kısmi)',
          description: 'Belirtilen ID numaralı kullanıcının yalnızca gönderilen değişkenlerini günceller. Diğer alanlar korunur.',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
              description: 'Güncellenecek kullanıcının ID numarası (Örn: 2)'
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
              description: 'Kullanıcı güncellendi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      message: { type: 'string', example: 'ID\'si 2 olan kullanıcı başarıyla güncellendi' },
                      user: { $ref: '#/components/schemas/User' }
                    }
                  }
                }
              }
            },
            404: {
              description: 'Kullanıcı bulunamadı'
            }
          }
        },
        put: {
          tags: ['Kullanıcılar (Users)'],
          summary: 'Kullanıcı Güncelle (PUT)',
          description: 'Belirtilen ID numaralı kullanıcının alanlarını PUT metodu ile günceller.',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
              description: 'Güncellenecek kullanıcının ID numarası (Örn: 2)'
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
              description: 'Kullanıcı PUT ile güncellendi'
            },
            404: {
              description: 'Kullanıcı bulunamadı'
            }
          }
        },
        delete: {
          tags: ['Kullanıcılar (Users)'],
          summary: 'Kullanıcı Sil (DELETE)',
          description: 'Belirtilen ID numaralı kullanıcıyı kalıcı veritabanından siler.',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
              description: 'Silinecek kullanıcının ID numarası (Örn: 2)'
            }
          ],
          responses: {
            200: {
              description: 'Kullanıcı başarıyla silindi',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'success' },
                      message: { type: 'string', example: 'ID\'si 2 olan kullanıcı başarıyla silindi' },
                      deletedUser: { $ref: '#/components/schemas/User' }
                    }
                  }
                }
              }
            },
            404: {
              description: 'Kullanıcı bulunamadı'
            }
          }
        }
      },
      '/hello': {
        get: {
          tags: ['Yardımcı & Örnek Uç Noktalar'],
          summary: 'Hello World',
          description: 'Sabit metin yanıtı döner.',
          responses: { 200: { description: 'hello world' } }
        }
      },
      '/hello/{name}': {
        get: {
          tags: ['Yardımcı & Örnek Uç Noktalar'],
          summary: 'Dinamik Selamlama',
          parameters: [
            {
              name: 'name',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              example: 'Sefe'
            }
          ],
          responses: { 200: { description: 'Hello, {name}' } }
        }
      },
      '/sum/{number1}/{number2}': {
        get: {
          tags: ['Yardımcı & Örnek Uç Noktalar'],
          summary: 'İki Sayıyı Topla',
          parameters: [
            { name: 'number1', in: 'path', required: true, schema: { type: 'number' }, example: 15 },
            { name: 'number2', in: 'path', required: true, schema: { type: 'number' }, example: 35 }
          ],
          responses: { 200: { description: 'Toplam sayı değeri' } }
        }
      }
    }
  },
  // Dinamik olarak yeni eklenen route dosyalarındaki @openapi / @swagger açıklamalarını da otomatik tarar
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../app.js')
  ]
};

const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {
  // Swagger UI route: /api/swagger
  app.use('/api/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Alumni Network - Swagger API Docs',
    customCss: '.swagger-ui .topbar { display: flex; background-color: #1e3a8a; }'
  }));

  // JSON formatında OpenAPI spesifikasyonu
  app.get('/api/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('Swagger UI dokümantasyonu aktif: http://localhost:5000/api/swagger');
}

module.exports = {
  setupSwagger,
  swaggerSpec
};
