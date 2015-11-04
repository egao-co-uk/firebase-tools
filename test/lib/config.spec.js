'use strict';

var chai = require('chai');
var expect = chai.expect;

var Config = require('../../lib/config');
var path = require('path');

var _fixtureDir = function(name) {
  return path.resolve(__dirname, '../fixtures/' + name);
};

describe('Config', function() {
  describe('#new', function() {
    it('should hoist legacy hosting keys', function() {
      var config = new Config({
        name: 'throwaway',
        public: 'public',
        ignore: ['**/.*'],
        rewrites: [],
        redirects: [],
        headers: []
      }, {});

      expect(config.data.hosting).to.have.property('public', 'public');
      expect(config.data.hosting).to.have.property('ignore');
      expect(config.data.hosting).to.have.property('rewrites');
      expect(config.data.hosting).to.have.property('redirects');
      expect(config.data.hosting).to.have.property('headers');
    });

    it('should not hoist if hosting key is present', function() {
      var config = new Config({
        name: 'throwaway',
        hosting: {public: '.'},
        rewrites: []
      }, {});

      expect(config.data.hosting).to.have.property('public', '.');
      expect(config.data.hosting).not.to.have.property('rewrites');
    });

    it('should generate trigger rules for functions', function() {
      var config = new Config({
        functions: {myfunc: {triggers: {database: {path: '/abc'}}}},
        rules: {abc: {'.read': true}}
      }, {});

      expect(config.data.rules.abc).to.deep.eq({
        '.function': {name: '"myfunc"', condition: 'true'},
        '.read': true
      });
    });
  });

  describe('#importLegacyKeys', function() {
    it('should respect non-overlapping keys in hosting', function() {
      var redirects = [{source: '/foo', destination: '/bar.html', type: 301}];
      var rewrites = [{source: '**', destination: '/index.html'}];
      var config = new Config({
        rewrites: rewrites,
        hosting: {
          redirects: redirects
        }
      }, {});

      config.importLegacyKeys();
      expect(config.get('hosting.redirects')).to.eq(redirects);
      expect(config.get('hosting.rewrites')).to.eq(rewrites);
    });
  });

  describe('#_parseFile', function() {
    it('should load a cjson file', function() {
      var config = new Config({}, {cwd: _fixtureDir('config-imports')});
      expect(config._parseFile('hosting', 'hosting.json').public).to.equal('.');
    });

    it('should error out for an unknown file', function() {
      var config = new Config({}, {cwd: _fixtureDir('config-imports')});
      expect(function() {
        config._parseFile('hosting', 'i-dont-exist.json');
      }).to.throw('Imported file i-dont-exist.json does not exist');
    });

    it('should error out for an unrecognized extension', function() {
      var config = new Config({}, {cwd: _fixtureDir('config-imports')});
      expect(function() {
        config._parseFile('hosting', 'unsupported.txt');
      }).to.throw('unsupported.txt is not of a supported config file type');
    });
  });

  describe('#_materialize', function() {
    it('should assign unaltered if an object is found', function() {
      var config = new Config({example: {foo: 'bar'}}, {});
      expect(config._materialize('example').foo).to.equal('bar');
    });
  });
});
