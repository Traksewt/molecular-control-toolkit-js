molecular-control-toolkit-js
============================

A javascript adapter to the molecular control toolkit.

see https://github.com/Traksewt/molecular-control-toolkit

This toolkit can be used to transfer Leap Motion events in the browser direct to an applet.

in the browser JS:
<code>

	var leapToolkit = new molecularControlToolkitJS.leap(gestures());

	var gestures = function () {
	  var functions = ['triggerPan', 'triggerRotate', 'triggerZoom', 'point', 'reset', 'zoomToSelection', 'selectMouseCursor'];
	  var ret = {};
	  functions.forEach(function (funcName) {
	    ret[funcName] = function () {
	      var newArgs = [funcName];
	      newArgs.push(Array.prototype.slice.call(arguments));
	      if (document.applets[0]) {
	        document.applets[0].molecularControlToolkit.apply(document.applets[0], newArgs);
	      }
	    }
	  })
	  return ret;
	}

	leapToolkit.start()
</code>
	
in the applet:
<code>

TunnellingConnector connector = null;

	public void initialise() {
	        MolecularControlToolkit molecularControlToolkit = new MolecularControlToolkit();
	        	this.connector = (TunnellingConnector) molecularControlToolkit.addConnector(ConnectorType.LeapMotionJS);
	        MyDispatcher dispatcher = new MyDispatcher();
	        molecularControlToolkit.setListeners(dispatcher);
	}

	/** The entry point for the browser events */
	public void molecularControlToolkit(String methodName, float[] arguments) {
		System.out.println("Method: " + methodName + ", args: " + Arrays.asList(arguments).toString());
		if (this.connector != null) {
			this.connector.tunnel(methodName, arguments);
		}
	}
</code>
