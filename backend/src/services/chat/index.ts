import amqp from 'amqplib'
import 'dotenv/config'

const RABBITMQ_URL = `amqp://${process.env.RABBITMQ_USER_URL}@${process.env.SERVER_URL}`

const sendMessage = async (message: string) => {
  const connection = await amqp.connect(RABBITMQ_URL)
  const channel = await connection.createChannel()
  const queue = 'chatservice_queue'
  // Buffer.from(message） to binary data stream for passing to the server through https;
  await channel.assertQueue(queue, { durable: true })
  channel.sendToQueue(queue, Buffer.from(message), { persistent: true })
  console.log(" [x] Sent 'Hello World'")
  await channel.close()
  await connection.close()
}

;(async () => {
  await sendMessage('test message')
})()
