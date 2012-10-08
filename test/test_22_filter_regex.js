var vows = require('vows'),
    assert = require('assert'),
    os = require('os'),
    patterns_loader = require('../lib/lib/patterns_loader'),
    filter_helper = require('./filter_helper');

patterns_loader.add('/toto');
patterns_loader.add('/tata');
patterns_loader.add('../lib/patterns');

vows.describe('Filter regex ').addBatch({
  'normal': filter_helper.create('regex', '?regex=^(\\S+) (\\S+)&fields=fa,fb', [
    {'@message': 'abcd efgh ijk'},
    {'@message': 'abcd efgh ijk', '@fields': {fc: 'toto'}},
    {'@message': 'abcdefghijk'},
  ], [
    {'@message': 'abcd efgh ijk', '@fields': {fa: 'abcd', fb: 'efgh'}},
    {'@message': 'abcd efgh ijk', '@fields': {fa: 'abcd', fb: 'efgh', fc: 'toto'}},
    {'@message': 'abcdefghijk'},
  ]),
  'number management': filter_helper.create('regex', '?regex=^(\\S+)$&fields=a', [
    {'@message': '12'},
    {'@message': '90'},
    {'@message': '12.3'},
    {'@message': '11,67'},
    {'@message': 'aa'},
    {'@message': ''},
  ], [
    {'@message': '12', '@fields': {a: 12}},
    {'@message': '90', '@fields': {a: 90}},
    {'@message': '12.3', '@fields': {a: 12.3}},
    {'@message': '11,67', '@fields': {a: 11.67}},
    {'@message': 'aa', '@fields': {a: 'aa'}},
    {'@message': ''},
  ], function(r) {
    assert.equal(typeof(r[0]['@fields'].a), 'number');
    assert.equal(typeof(r[1]['@fields'].a), 'number');
    assert.equal(typeof(r[2]['@fields'].a), 'number');
    assert.equal(typeof(r[3]['@fields'].a), 'number');
    assert.equal(typeof(r[4]['@fields'].a), 'string');
  }),
  'with star': filter_helper.create('regex', '?regex=^(\\S*) (\\S+)&fields=fa,fb', [
    {'@message': ' efgh ijk'},
  ], [
    {'@message': ' efgh ijk', '@fields': {fb: 'efgh'}},
  ]),
  'type filtering': filter_helper.create('regex', '?only_type=toto&regex=^(\\S+) (\\S+)&fields=fa,fb', [
    {'@message': 'abcd efgh ijk'},
    {'@message': 'abcd efgh ijk', '@type': 'toto'},
    {'@message': 'abcd efgh ijk', '@type': 'toto2'},
  ], [
    {'@message': 'abcd efgh ijk'},
    {'@message': 'abcd efgh ijk', '@type': 'toto', '@fields': {fa: 'abcd', fb: 'efgh'}},
    {'@message': 'abcd efgh ijk', '@type': 'toto2'},
  ]),
  'two fields one in regex': filter_helper.create('regex', '?regex=^(\\S+) \\S+&fields=fa,fb', [
     {'@message': 'abcd efgh ijk'},
  ], [
    {'@message': 'abcd efgh ijk', '@fields': {fa: 'abcd'}},
  ]),
  'one field two in regex': filter_helper.create('regex', '?regex=^(\\S+) (\\S+)&fields=fa', [
    {'@message': 'abcd efgh ijk'},
  ], [
    {'@message': 'abcd efgh ijk', '@fields': {fa: 'abcd'}},
  ]),
  'date parsing': filter_helper.create('regex', '?regex=^(.*)$&fields=timestamp&date_format=DD/MMMM/YYYY:HH:mm:ss ZZ', [
    {'@message': '31/Jul/2012:18:02:28 +0200}'},
    {'@message': '31/Jul/2012'},
    {'@message': 'toto'},
  ], [
    {'@message': '31/Jul/2012:18:02:28 +0200}', '@fields': {}, '@timestamp': '2012-07-31T16:02:28+00:00'},
    {'@message': '31/Jul/2012', '@fields': {}, '@timestamp': '2012-07-31T00:00:00+00:00'},
    {'@message': 'toto', '@fields': {}, '@timestamp': '0000-01-01T00:00:00+00:00'},
  ]),
  'nginx parsing': filter_helper.create('regex', '?regex=^(\\S+) - (\\S*) ?- \\[([^\\]]+)\\] "([^"]+)" (\\d+) (\\d+) "([^"]*)" "([^"]*)"&fields=ip,user,timestamp,request,status,bytes_sent,referer,user_agent&date_format=DD/MMMM/YYYY:HH:mm:ss ZZ', [
    {'@message': '127.0.0.1 - - [31/Jul/2012:18:02:28 +0200] "GET /favicon.ico HTTP/1.1" 502 574 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_4) AppleWebKit/537.2 (KHTML, like Gecko) Chrome/22.0.1215.0 Safari/537.2"'},
    {'@message': '127.0.0.1 - - [31/Jul/2012:18:02:48 +0200] "-" 400 0 "-" "-"'},
  ],[
    {
      '@message': '127.0.0.1 - - [31/Jul/2012:18:02:28 +0200] "GET /favicon.ico HTTP/1.1" 502 574 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_4) AppleWebKit/537.2 (KHTML, like Gecko) Chrome/22.0.1215.0 Safari/537.2"',
      '@fields': {
        ip: '127.0.0.1',
        request: 'GET /favicon.ico HTTP/1.1',
        status: 502,
        bytes_sent: 574,
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_4) AppleWebKit/537.2 (KHTML, like Gecko) Chrome/22.0.1215.0 Safari/537.2',
        referer: '-',
      },
      '@timestamp': '2012-07-31T16:02:28+00:00'
    },
    {
      '@message': '127.0.0.1 - - [31/Jul/2012:18:02:48 +0200] "-" 400 0 "-" "-"',
       '@fields': {
        ip: '127.0.0.1',
        request: '-',
        status: 400,
        bytes_sent: 0,
        user_agent: '-',
        referer: '-',
      },
      '@timestamp': '2012-07-31T16:02:48+00:00'
    },
  ], function(r) {
    assert.equal(typeof(r[0]['@fields'].status), 'number');
    assert.equal(typeof(r[0]['@fields'].bytes_sent), 'number');
    assert.equal(typeof(r[0]['@fields'].referer), 'string');
  }),
  'nginx parsing with predefined type': filter_helper.create('regex', 'nginx_combined', [
    {'@message': '127.0.0.1 - - [31/Jul/2012:18:02:28 +0200] "GET /favicon.ico HTTP/1.1" 502 574 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_4) AppleWebKit/537.2 (KHTML, like Gecko) Chrome/22.0.1215.0 Safari/537.2"'},
  ],[
    {
      '@message': '127.0.0.1 - - [31/Jul/2012:18:02:28 +0200] "GET /favicon.ico HTTP/1.1" 502 574 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_4) AppleWebKit/537.2 (KHTML, like Gecko) Chrome/22.0.1215.0 Safari/537.2"',
      '@fields': {
        ip: '127.0.0.1',
        request: 'GET /favicon.ico HTTP/1.1',
        status: 502,
        bytes_sent: 574,
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_4) AppleWebKit/537.2 (KHTML, like Gecko) Chrome/22.0.1215.0 Safari/537.2',
        referer: '-',
      },
      '@timestamp': '2012-07-31T16:02:28+00:00'
    },
  ]),
  'nginx parsing with predefined type (2)': filter_helper.create('regex', 'nginx_combined', [
    {'@message': '127.0.0.1 - - [31/Jul/2012:18:02:28 +0200] "GET /favicon.ico HTTP/1.1" 502 574 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_4) AppleWebKit/537.2 (KHTML, like Gecko) Chrome/22.0.1215.0 Safari/537.2"'},
  ],[
    {
      '@message': '127.0.0.1 - - [31/Jul/2012:18:02:28 +0200] "GET /favicon.ico HTTP/1.1" 502 574 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_4) AppleWebKit/537.2 (KHTML, like Gecko) Chrome/22.0.1215.0 Safari/537.2"',
      '@fields': {
        ip: '127.0.0.1',
        request: 'GET /favicon.ico HTTP/1.1',
        status: 502,
        bytes_sent: 574,
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_4) AppleWebKit/537.2 (KHTML, like Gecko) Chrome/22.0.1215.0 Safari/537.2',
        referer: '-',
      },
      '@timestamp': '2012-07-31T16:02:28+00:00'
    },
  ]),
}).export(module);