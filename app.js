var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var nunjucks = require('nunjucks');
var util = require('util');
var common = require('common');
var commonSetting = common.commonSetting;
var mgSession = common.mgSession();

var indexRoute = require('./routes/index');
var authRoute = require('./routes/auth');

var app = express();

// view engine setup
nunjucks.configure('views', {
    autoescape: true,
    express: app
});

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use('/', express.static(__dirname + '/public'));
app.use('/auth', express.static(__dirname + '/public'));

app.use(function (req, res, next) {
    res.locals.commonSetting = JSON.stringify({
        WEB_SOCKET_URL: common.commonSetting.WEB_SOCKET_URL,
        WS_URL: common.commonSetting.WS_URL,
        WEB_HTTP_URL: common.commonSetting.WEB_HTTP_URL,
        LEGEND_HTTP_URL: common.commonSetting.LEGEND_HTTP_URL,
        FILE_URL: common.commonSetting.FILE_URL,
        STATIC_URL: common.commonSetting.STATIC_URL
    });
    res.locals.resDomain = "";
    next();
});

app.use('/', indexRoute);
app.use('/auth', authRoute);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers
// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('templates/error.html', {
        message: err.message,
        error: app.get('env') === 'development' ? err : {}
    });
});

var port = common.serverHelper.normalizePort(process.env.PORT || common.serverPorts.server);
common.serverHelper.startServer(port, app);