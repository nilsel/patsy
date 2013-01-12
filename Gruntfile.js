/**
 * This file holds the grunt configuration for patsy
 *
 * If the documented code here does not fullfill your needs, check the wiki on github here: https://github.com/phun-ky/patsy/wiki
 *
 * We do a bit more tweaking that we should here, but while we wait for grunt to be omnipotent, we do it like we do.
 *
 * grunt is copyrighted to "Cowboy" Ben Alman
 *
 * https://github.com/gruntjs/grunt
 *
 * Copyright (c) 2012 "Cowboy" Ben Alman
 * Licensed under the MIT license.
 * http://benalman.com/about/license/
 */
 "use strict";

/**
 * Require util plugin from node
 *
 * @var     Object
 * @source  NodeJS
 */
var util              = require('util');

/**
 * Require path plugin from node
 *
 * @var     Object
 * @source  NodeJS
 */
var path              = require('path');

/**
 * Require patsyHelpers from the library
 *
 * @var     Object
 * @source  patsy
 */
var patsyHelpers      = require('./lib/patsyHelpers');

/**
 * Varholder for the [full] project path
 *
 * @var     String
 * @source  grunt.option
 */
var projectPath       = '';

/**
 * Variable for the project configuration
 *
 * @var     Object
 * @source  patsy.json
 */
var config;

/**
 * Varholder for relative project path, used to negate full window path issues
 *
 * @var     String
 */
var relativeProjectPath;

/**
 * Varholder for test tasks
 *
 * @var     Array
 */
var testTasks = [];



/**
 * Set up grunt and export it for use
 *
 * @var     Function
 */
module.exports = function(grunt) {

  // Populate project variables, used for better readability
  projectPath       = grunt.option('path');



  // Do we have a projectPath defined
  if(typeof projectPath !== 'undefined'){

    if(!patsyHelpers.doesConfigExist(projectPath + 'patsy.json')){

      console.log('Project configuration not found, exiting...');
      process.exit(1);
    } else {

      // Set config from patsy.json
      // Until we can access objects from inside grunt.initConfig with templating,
      // we've to load the file into another variable
      config = patsyHelpers.loadPatsyConfigInCurrentProject(projectPath);

      // A crude way to do this, but bare with us, this will improve
      if(config.build.test.suites.jasmine){
        testTasks.push('jasmine');
        grunt.loadNpmTasks('grunt-contrib-jasmine');


        config.build.test.suites.jasmine.src = config.project.relativeProjectPath + config.build.test.suites.jasmine.src;
      }

      if(config.build.test.suites.nodeunit){
        testTasks.push('nodeunit');
        grunt.loadNpmTasks('grunt-contrib-nodeunit');


        config.build.test.suites.nodeunit.src = config.project.relativeProjectPath + config.build.test.suites.nodeunit.src;


      }

      if(config.build.test.suites.qunit){
        testTasks.push('qunit');
        config.build.test.suites.qunit.src = config.project.relativeProjectPath + config.build.test.suites.qunit.src;
        grunt.loadNpmTasks('grunt-contrib-qunit');
      }
    }

  } else {

    console.log('Project path not set, exiting...');
    process.exit(1);
  }

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.loadNpmTasks('grunt-dox');
  grunt.loadNpmTasks('grunt-mustache');
  grunt.loadNpmTasks('grunt-minified');
  grunt.loadNpmTasks('grunt-recess');
  grunt.loadNpmTasks('grunt-reload');

  patsyHelpers.gruntConfig = {
    // Read patsys configuration file into pkg
    pkg: grunt.file.readJSON('package.json'),
    // Read the projects configuration file into app
    app : grunt.file.readJSON(config.project.relativeProjectPath + 'patsy.json'),
    // Set basepath
    basepath : config.project.relativeProjectPath,
    banner: '/** \n * Generated by <%= pkg.title || pkg.name %> '+
      '<%= app.project.name ? "for " + app.project.name + "" : "" %>' +
      '\n *\n' +
      ' * @version v<%= pkg.version %> \n' +
      ' * @date <%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? " * @link " + pkg.homepage + "\\n" : "" %> */\n',
    // Watch tasks
    watch: {
      scripts : {
        files : [
          '<%= basepath %><%= app.build.js %>**/*.js',
          '<%= basepath %><%= app.build.tmpl.src %>*.mustache',
          '<%= basepath %><%= app.build.css.src %>**/*.css',
          '<%= basepath %><%= app.build.css.src %>**/*.less'
        ],
        tasks: ['jshint','mustache', 'minified','dox','recess'],
        options : {
          debounceDelay: 2500
        }
      },
      concatinate : {
        files : ['<%= basepath %><%= app.build.min.dest %>*.js'],
        tasks : ['concat']
      }
    },
    // Tasks
    clean: {
      folder: '<%= basepath %><%= app.build.dist %>debug/*'
    },
    jasmine : config.build.test.suites.jasmine || {},
    nodeunit : config.build.test.suites.nodeunit || {},
    qunit : config.build.test.suites.qunit || {},
    minified : {
      files: {
        src: [
          '<%= basepath %><%= app.build.js %>**/*.js',
          '<%= basepath %><%= app.build.js %>*.js'
        ],
        dest: '<%= basepath %><%= app.build.min.dest %>',
        options: config.build.min.options || {}
      }
    },
    jshint : {
      options : {
        indent : 2,
        white : false,
        passfail: true
      },
      src: [

        '<%= basepath %><%= app.build.js %>**/*.js',
        '!<%= basepath %><%= app.build.js %>templates.js',
        '!<%= basepath %><%= app.build.min.dest %>*.js',
        '!<%= basepath %><%= app.build.dist %>*.js'

      ]
    },
    concat: {
      options : {
        banner: '<%= banner %>'
      },
      dist: {
        src:  [
                '<%= basepath %><%= app.build.min.dest %>*.js'
              ],
        dest: '<%= basepath %><%= app.build.dist %><%= app.project.name %>.core.js'
      }
    },
    mustache:{
      files: {
        dest : '<%= basepath %><%= app.build.js %>templates.js',
        src : ['<%= basepath %><%= app.build.tmpl.src %>']
      },
      options: config.build.tmpl.options || {}
    },
    dox: {
      files: {
        src: ['<%= basepath %><%= app.build.js %>**/*.js'],
        dest: '<%= basepath %><%= app.build.docs.dest %>'
      },
      options: config.build.docs.options || {}
    },
    recess: {
      dist: {
        src: [
          '<%= basepath %><%= app.build.css.src %>**/*.css',
          '<%= basepath %><%= app.build.css.src %>**/*.less'
        ],
        dest: '<%= basepath %><%= app.build.css.dist %>style.css',
        options: config.build.css.options || { compile: true }
      }
    },
    globals: {

    }
  };

  // GruntJS configuration
  grunt.initConfig(patsyHelpers.gruntConfig);


  grunt.registerTask('default', ['watch']);
  grunt.registerTask('test', testTasks);
  grunt.registerTask('all', ['jshint','mustache', 'minified','dox','recess','concat'].concat(testTasks));


};
