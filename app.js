'use strict';

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var helmet = require('helmet');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var boardRouter = require('./routes/board');
var weatherRouter = require('./routes/weather');
var schedulerRouter=require('./routes/scheduler');
var swaggerUi = require('swagger-ui-express')
var swaggerJSDoc = require('swagger-jsdoc')

var app = express();

const swaggerDefinition = {
  info: { // API informations (required)
    title: 'Weatherook', // Title (required)
    version: '1.0.0', // Version (required)
    description: 'weatherook', // Description (optional)
  },
  host: 'weatherook.cf', // Host (optional)
  basePath: '/', // Base path (optional)
}

const options = {
  // Import swaggerDefinitions
  swaggerDefinition,
  // Path to the API docs
  apis: ['./api/weatherook.yml'],
}

const swaggerSpec = swaggerJSDoc(options)


//웹 연동
var cors=require('cors');
app.use(cors());
app.use(helmet());


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/', indexRouter);
app.use('/user', usersRouter);
app.use('/board', boardRouter);
app.use('/weather', weatherRouter);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



module.exports = app;
