module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      all: [
        'Gruntfile.js',
        'features/**/*.js',
        'example/**/*.js',
        'lib/**/*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    mkdir: {
      tmp: {
        options: {
          mode: 0700,
          create: ['tmp']
        }
      }
    },

    clean: {
      tmp: ['tmp']
    },

    shell: {
      features: {
        command: 'node lib/cli/cli.js -c default'
      },
      ide: {
        command: 'node lib/cli/cli.js -c ide'
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-mkdir');

  grunt.registerTask('features', ['shell:features']);

  grunt.registerTask('test', [/*'jshint',*/ 'mkdir:tmp', 'features']);
  grunt.registerTask('default', ['test']);

};