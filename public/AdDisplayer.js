/*
  Displays ads on a canvas
  parameters:
   - canvas: the canvas element where the ads will be displayed
   - addId: the id of the div holding the add <script> tag
 */
function AdDisplayer(canvas, addId) {

  var
    HIDE_THRESHOLD = 7,

    CANVAS = canvas,
    AD_WRAPPER = document.getElementById(addId + '_wrapper'),
    AD = document.getElementById(addId),

    offsetLeft = CANVAS.offsetLeft,
    offsetTop = CANVAS.offsetTop
  ;

  var hideCallCount = 0;

  this.display = function(faceX, faceY, faceWidth, faceHeight) {
    AD_WRAPPER.style.display = 'block';
    AD_WRAPPER.style.left = (offsetLeft + faceX) + 'px';
    AD_WRAPPER.style.top = (offsetTop + faceY) + 'px';

    // Scale it - 300px wide by default
    AD.style.transform = 'scale(' + (faceWidth / 300) + ')';
  }

  this.hide = function() {
    // Require HIDE_THRESHOLD calls to hide before actually hiding
    // the ad. This is because the feature detection code will
    // recognize lots of different features intermittently.
    if (hideCallCount > HIDE_THRESHOLD) {
      AD_WRAPPER.style.display = 'none';
      hideCallCount = 0;      
    } else {
      hideCallCount++;
    }
  }

}