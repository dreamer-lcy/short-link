/*
 * @Author: zi.yang
 * @Date: 2024-12-13 17:38:41
 * @LastEditors: zi.yang
 * @LastEditTime: 2025-06-10 00:12:49
 * @Description: 
 * @FilePath: /short-link/api/index.js
 */
import Fastify from 'fastify';

import * as linkService from '../service/link.js';

const app = Fastify({
  logger: true,
})

app.post('/api/addUrl', async (req, reply) => {
  const url = req.body?.url
  if (!url) {
    return reply.status(200).type('application/json').send({
      code: 401,
      msg: 'URL 是必填参数'
    })
  }

  // 验证URL格式
  const urlPattern = /^(https?:\/\/|#小程序:\/\/).+/;
  if (!urlPattern.test(url)) {
    return reply.status(200).type('application/json').send({
      code: 401,
      msg: 'URL 格式不正确，必须以 http://、https:// 或 #小程序:// 开头'
    })
  }

  const result = await linkService.addUrl(req)
  if (result.error) {
    return reply.status(200).type('application/json').send({
      code: 401,
      msg: result.error.message || '未知错误'
    })
  }
  return reply.status(200).type('application/json').send({
    code: 200,
    msg: 'success',
    url: `/${result.data.short}`
  })
})

app.get('/:hash', async (req, reply) => {
  if (req.params?.hash) {
    const result = await linkService.getUrl(req.params.hash)
    if (!result || !result.data?.length || result.error) {
      return reply.status(200).type('application/json').send({
        code: 401,
        msg: result.error.message || '短链接不存在'
      })
    }
    return reply.status(302).redirect(result.data[0].link)
  }
  return reply.status(200).type('application/json').send({
    code: 401,
    msg: '短链接不存在'
  })
})

export default async function handler(req, reply) {
  await app.ready()
  app.server.emit('request', req, reply)
}

// 本地开发启动
if (process.env.NODE_ENV !== 'production') {
  const start = async () => {
    try {
      await app.listen({ port: 3000, host: '0.0.0.0' })
      console.log(`Server listening on ${app.server.address().port}`)
    } catch (err) {
      app.log.error(err)
      process.exit(1)
    }
  }
  start()
}
