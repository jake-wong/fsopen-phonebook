require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')
const app = express()

morgan.token('body', (req, res) => JSON.stringify(req.body))

app.use(express.static('build'))
app.use(express.json())
app.use(cors())
app.use(morgan((tokens, req, res) => {
  let log = [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'), '-',
    tokens['response-time'](req, res), 'ms'
  ]
  if(req.method === 'POST') {
    log = log.concat(tokens['body'](req, res))
  }
  return log.join(" ")
}))

let persons = [
  {
    name: "Arto Hellas",
    number: "040-123456",
    id: 1
  },
  {
    name: "Ada Lovelace",
    number: "39-44-5323523",
    id: 2
  },
  {
    name: "Dan Abramov",
    number: "12-43-234345",
    id: 3
  },
  {
    name: "Mary Poppendieck",
    number: "39-23-6423122",
    id: 4
  }
]

app.get('/api/persons', (request, response) => {
  Person.find({}).then(persons => response.json(persons))
})

app.get('/api/persons/:id', (request, response, next) => {
  const id = request.params.id
  Person.findById(id)
    .then(person => {
      if(person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => {
      next(error)
    })
})

app.delete('/api/persons/:id', (request, response, next) => {
  const id = request.params.id
  Person.findByIdAndRemove(id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  const id = request.params.id
  const body = request.body
  const updatedPerson = {
    name: body.name,
    number: body.number
  }
  Person.findByIdAndUpdate(id, updatedPerson, { new: true })
    .then(result => response.json(result))
    .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
  const body = request.body

  const person = new Person ({
    name: body.name,
    number: body.number,
  })

  person.save()
    .then(savedPerson => {
      response.json(savedPerson)
    })
    .catch(error => next(error))
})

app.get('/info', (request, response) => {
  Person.find({})
    .then(result => {
      response.send(`<p>Phonebook has info for ${result.length} people</p>
      <p>${new Date()}</p>`)
    })
})

const errorHandler = (error, request, response, next) => {
  if(error.name === 'CastError') {
    return response.status(400).send({ error: 'Malformatted id' })
  }
  if(error.name === 'ValidationError') {
    return response.status(400).send({ error: error.message })
  }
  if(error.name === 'MongoServerError') {
    return response.status(409).send({ error: 'Name must be unique' })
  }
}

app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
})