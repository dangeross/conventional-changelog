var es = require('event-stream');
var Writer = require('./Writer');

var EMPTY_COMPONENT = '$$';

function writeLog(commits, options, done) {
  var log = '';
  var stream = es.through(function(data) {
    log += data;
  }, function() {
    done(null, log);
  });

  var writer = new Writer(stream, options);
  var sections = {};
  var types = {
    breaks: 'Breaking Changes',
    chore: 'Build Process',
    doc: 'Documentation',
    feat: 'Features',
    fix: 'Bug Fixes',
    refactor: 'Optimizations',
    style: 'Code Formatting',
    test: 'Testing'
  };

  commits.forEach(function(commit) {
    if (types[commit.type]) {
      sections[commit.type] = sections[commit.type] || {};

      var section = sections[commit.type];
      var component = commit.component || EMPTY_COMPONENT;

      if (section) {
        section[component] = section[component] || [];
        section[component].push(commit);
      }

      commit.breaks.forEach(function(breakMsg) {
        sections.breaks[EMPTY_COMPONENT] = sections.breaks[EMPTY_COMPONENT] || [];

        sections.breaks[EMPTY_COMPONENT].push({
          subject: breakMsg,
          hash: commit.hash,
          closes: []
        });
      });
    }
  });

  if (!writer.header()) {
    return done('No version specified');
  }

  options.types.forEach(function(type) {
    if (sections[type]) {
      writer.section(types[type], sections[type]);
    }
  });

  writer.end();
}

module.exports = writeLog;
