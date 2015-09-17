
/**
 * Module dependencies.
 */

var utils   = require('./utils');
var config  = require('../etc/config');


var default_options = config.options;

/**
 * Constructor.
 *
 * @param {Source | String} [source] - optional stream to be written or method to call
 * @param {String} method - method to call for storing the input | stream
 */
function transporter(options) {
  

  	var self = this;
    
    if (options)
      self.opts = utils.merge(default_options, options);
    else
      self.opts = default_options;
      
      
    // Create a subfolder with method name : For example fetch / image
    if (self.opts.store){
      var store = utils.clone(self.opts.store);
      if (self.opts.method)
        if (self.opts.store.dir)
            store.dir = self.opts.store.dir + "/" + self.opts.method;
        
      self.store = new (self.getTransport(self.opts.store.type))(store);
    }
   
    
   	if (self.opts.cache){
   	  var cache = utils.clone(self.opts.cache);
   	  if (self.opts.method)
        if (self.opts.cache.dir)
            cache.dir = self.opts.cache.dir + "/" + self.opts.method;
            
   	  self.cache = new (self.getTransport(self.opts.cache.type))(cache);
   	}
 
   	
   	
}

transporter.prototype.getTransport = function(type){
  
    if (type && config.transports[type])
      return config.transports[type];
    else
      return require('./transport/dummy');
}

/**
 * Get the file from cache or
 * Get the file from store or
 * Fetch
 */ 
transporter.prototype.get = function(src, done){
  var self = this;
  
  var from_cache = function(src){
    if (!self.opts.cache)
      return from_store(src);
    
    self.cache.get(utils.getFilenameBySrc(src), function(err, cached_file){
      if (!err)
        return done(null, cached_file, 'cache');
      
      return from_store(src);
    });
  };
  
  var from_store = function(src){
    if (!self.opts.store)
      return from_url(src);
    
     self.store.get(utils.getFilenameBySrc(src), function(err, stored_file){
        if (!err)
          return done(null, stored_file, 'store');
        
        return from_url(src);
     });
  };
  
  var from_url = function(src){
     if (!self.opts.method == 'fetch')
      return  done('Not found', null, 'url');
      
     var http = new (self.getTransport('http'))({req_timeout : self.opts.req_timeout, req_max_size : self.opts.req_max_size});

     http.get(src, function(err, response){
        if (err)
          return  done(err, null, 'url');
          
        return done(null, response, 'url')
       
     });
  };
  
  /**
   * look for file from cache first 
   * if not found -> look in store 
   * if not found -> fetch
   */ 
   from_cache(src);
  
}


 module.exports = transporter;

