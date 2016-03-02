/**
 * pubsub.js
 *
 * A tiny, optimized, tested, standalone and robust
 * pubsub implementation supporting different javascript environments
 *
 * @author Federico "Lox" Lucignano <http://plus.ly/federico.lox>
 *
 * @see https://github.com/federico-lox/pubsub.js
 */

/*global define, module*/
(function (context) {
	'use strict';

	/**
	 * @private
	 */
	function init() {
		//the channel subscription hash
		var channels = {},
			//help minification
			funcType = Function;

			//return array of channels to publish to
			function getChannels(channel) {
				var paths = [];

				// if ( channels.hasOwnProperty( channel ) ) {
				// 	paths.push( channels[channel] );
				// }

				var chanPath = channel.split('/')
				// remove blank
				if (chanPath[0] === ''){
					chanPath.shift();
				}

				/* double star (match all terms for that section and after)
				 * i.e. /some/**
				 * would match /some/path/goes/here
				 * but not /something/else
				 */
				var path = "";
				if ( channels.hasOwnProperty( path + '/**' ) ) {
					paths.push( channels[path + '/**'] )
				}
				while(chanPath.length > 0) {
					path += '/' + chanPath.shift();
					if ( channels.hasOwnProperty( path + '/**' ) ) {
						paths.push(channels[path + '/**'])
					}
				}

				// single star (match all terms for that section)
				// i.e. /some/*/goes/here
				// would match /some/path/here
				// but not match /some/path
				// or /some/path/went/here

				var chanPath = channel.split('/')
				// remove blank
				if (chanPath[0] === ''){
					chanPath.shift();
				}
				for (var i = 0; i < chanPath.length; i++) {
					var tmpPath = '/';
					//build full term with star replacing the current section to check
					for (var x = 0; x < chanPath.length; x++) {
						if (i === x) {
							tmpPath += '*';
						}
						else {
							tmpPath += chanPath[x];
						}
						//dont add trailing slash to the path
						if (x < (chanPath.length - 1)){
							tmpPath += '/';
						}
					}
					if ( channels.hasOwnProperty( tmpPath ) ) {
						paths.push( tmpPath )
					}
				}

                if (channels.hasOwnProperty(channel)) {
                    paths.push(channels[channel]);
                }
				return paths
			}

		return {
			/*
			 * @public
			 *
			 * Publish some data on a channel
			 *
			 * @param String channel The channel to publish on
			 * @param Mixed argument The data to publish, the function supports
			 * as many data parameters as needed
			 *
			 * @example Publish stuff on '/some/channel'.
			 * Anything subscribed will be called with a function
			 * signature like: function(a,b,c){ ... }
			 *
			 * PubSub.publish(
			 *		"/some/channel", "a", "b",
			 *		{total: 10, min: 1, max: 3}
			 * );
			 */
			publish: function () {
				//help minification
				var args = arguments,
					// args[0] is the channel
					subs = getChannels(args[0]),
					len,
					params;

				if (subs) {
					len = subs.length;
					params = (args.length > 1) ?
							Array.prototype.splice.call(args, 1) : [];
					params.push(args[0].split('/'))

					//run the callbacks asynchronously,
					//do not block the main execution process
					setTimeout(
						function () {
							//executes callbacks in the order
							//in which they were registered
							for (var chanIter = 0; chanIter < len; chanIter += 1) {
                                for (var fnIter = 0; fnIter < subs[chanIter].length; fnIter++) {
									if (subs[chanIter][fnIter]) {
										subs[chanIter][fnIter].apply(context, params);
									}
                                }
							}

							//clear references to allow garbage collection
							subs = context = params = null;
						},
						0
					);
				}
			},

			/*
			 * @public
			 *
			 * Register a callback on a channel
			 *
			 * @param String channel The channel to subscribe to
			 * @param Function callback The event handler, any time something is
			 * published on a subscribed channel, the callback will be called
			 * with the published array as ordered arguments
			 *
			 * @return Array A handle which can be used to unsubscribe this
			 * particular subscription
			 *
			 * @example PubSub.subscribe(
			 *				"/some/channel",
			 *				function(a, b, c){ ... }
			 *			);
			 */
			subscribe: function (channel, callback) {
				if (typeof channel !== 'string') {
					throw "invalid or missing channel";
				}

				if (!(callback instanceof funcType)) {
					throw "invalid or missing callback";
				}

				if (!channels[channel]) {
					channels[channel] = [];
				}

				channels[channel].push(callback);

				return {channel: channel, callback: callback};
			},

			/*
			 * @public
			 *
			 * Disconnect a subscribed function f.
			 *
			 * @param Mixed handle The return value from a subscribe call or the
			 * name of a channel as a String
			 * @param Function callback [OPTIONAL] The event handler originaally
			 * registered, not needed if handle contains the return value
			 * of subscribe
			 *
			 * @example
			 * var handle = PubSub.subscribe("/some/channel", function(){});
			 * PubSub.unsubscribe(handle);
			 *
			 * or
			 *
			 * PubSub.unsubscribe("/some/channel", callback);
			 */
			unsubscribe: function (handle, callback) {
				if (handle.channel && handle.callback) {
					callback = handle.callback;
					handle = handle.channel;
				}

				if (typeof handle !== 'string') {
					throw "invalid or missing channel";
				}

				if (!(callback instanceof funcType)) {
					throw "invalid or missing callback";
				}

				var subs = channels[handle],
					x,
					y = (subs instanceof Array) ? subs.length : 0;

				for (x = 0; x < y; x += 1) {
					if (subs[x] === callback) {
						subs.splice(x, 1);
						break;
					}
				}
			}
		};
	}

	//UMD
	if (typeof define === 'function' && define.amd) {
		//AMD module
		define('pubsub', init);
	} else if (typeof module === 'object' && module.exports) {
		//CommonJS module
		module.exports = init();
	} else {
		//traditional namespace
		context.PubSub = init();
	}
}(this));
