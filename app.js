const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

let db = null // Initialize db variable

const dbPath = path.join(__dirname, 'moviesData.db')

async function initializeDBandServer() {
  try {
    db = await open({filename: dbPath, driver: sqlite3.Database})
    app.listen(3000, () => {
      console.log(`The server is running at port 3000`)
    })
  } catch (err) {
    console.log(`DB.Error ${err.message}`)
    process.exit(1)
  }
}

initializeDBandServer()

function converting(eachmovie) {
  return {movieName: eachmovie.movie_name}
}

// get all movies
app.get('/movies/', async (req, res) => {
  try {
    const getAllMoviesQuery = `
      SELECT movie_name FROM movie ORDER BY movie_id`

    const movieslist = await db.all(getAllMoviesQuery)
    const dbResponse = movieslist.map(each => converting(each))

    res.send(dbResponse)
  } catch (err) {
    res.status(500).send(err.message)
    console.log(`Internal Db error ${err.message}`)
  }
})

// post movie
app.post('/movies/', async (req, res) => {
  const movieDetails = req.body
  const {directorId, movieName, leadActor} = movieDetails

  if (!directorId || !movieName || !leadActor) {
    return res.status(400).send('All fields are required')
  }

  const addMovieQuery = `
    INSERT INTO movie (director_id, movie_name, lead_actor)  
    VALUES (${directorId}, '${movieName}', '${leadActor}')`

  try {
    await db.run(addMovieQuery)
    res.send('Movie Successfully Added')
  } catch (err) {
    console.log(`Error: ${err.message}`)
    res.status(500).send('Internal Server Error')
  }
})

// get movie ID

app.get('/movies/:movieId/', async (req, res) => {
  const {movieId} = req.params
  const getMovieQuery = `SELECT * FROM movie WHERE movie_id=${movieId}`

  try {
    const movie = await db.get(getMovieQuery)
    res.send(movie)
  } catch (err) {
    console.log(`Error: ${err.message}`)
    res.status(500).send('Internal Server Error')
  }
})

// update movie table

app.put('/movies/:movieId/', async (req, res) => {
  const {movieId} = req.params
  const {directorId, movieName, leadActor} = req.body

  // Check if required fields are provided
  if (!directorId || !movieName || !leadActor) {
    return res.status(400).send('All fields are required')
  }

  const updateMovieQuery = `
    UPDATE movie 
    SET director_id=${directorId}, movie_name='${movieName}', lead_actor='${leadActor}'
    WHERE movie_id=${movieId}`

  try {
    await db.run(updateMovieQuery)
    res.send('Movie Details Updated')
  } catch (err) {
    console.error(`Error updating movie details: ${err.message}`)
    res.status(500).send('Internal Server Error')
  }
})

// delete

app.delete('/movies/:movieId/', async (req, res) => {
  const {movieId} = req.params
  const deleteMovieQuery = `DELETE from movie where movie_id=${movieId}`
  await db.run(deleteMovieQuery)
  res.send('Movie Removed')
})

// directors
function convertDirector(eachdirector) {
  return {
    directorId: eachdirector.director_id,
    directorName: eachdirector.director_name,
  }
}

app.get('/directors/', async (req, res) => {
  const getDirectorsQuery = `SELECT * FROM director ORDER BY director_id`
  try {
    const directorList = await db.all(getDirectorsQuery)
    const dbResponse = directorList.map(each => convertDirector(each))
    res.send(dbResponse)
  } catch (err) {
    console.log(`Db.Error: ${err.message}`)
    res.status(500).send('Internal Server Error')
  }
})

app.get('/directors/:directorId/movies/', async (req, res) => {
  const {directorId} = req.params
  const getDirectorMoviesQuery = `
    SELECT movie_name 
    FROM movie
    WHERE director_id = ${directorId}
  `

  try {
    const movies = await db.all(getDirectorMoviesQuery)
    const movieresponse = movies.map(each => converts(each))
    res.send(movies)
  } catch (err) {
    console.log('Error in DB:', err.message) // Print error message
    res.status(500).send('Internal DB Error')
  }
})

function converts(moviename) {
  return {
    movieName: moviename.movie_name,
  }
}

module.exports = app
