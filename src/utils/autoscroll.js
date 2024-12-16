// Modified from code by Heather Booker
// https://medium.com/@heatherbooker/how-to-auto-scroll-to-the-bottom-of-a-div-415e967e7a24

export default function autoscroll(element) {
  function animateScroll(duration) {
    var start = element.scrollTop;
    var end = element.scrollHeight;
    var change = end - start;
    var increment = 20;

    function easeInOut(currentTime, start, change, duration) {
      // by Robert Penner
      currentTime /= duration / 2;
      if (currentTime < 1) {
        return (change / 2) * currentTime * currentTime + start;
      }
      currentTime -= 1;
      return (-change / 2) * (currentTime * (currentTime - 2) - 1) + start;
    }

    function animate(elapsedTime) {
      elapsedTime += increment;
      var position = easeInOut(elapsedTime, start, change, duration);
      element.scrollTop = position;
      if (elapsedTime < duration) {
        setTimeout(function () {
          animate(elapsedTime);
        }, increment);
      }
    }

    animate(0);
  }

  var fullyScrolled = true;

  function onScroll() {
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight#determine_if_an_element_has_been_totally_scrolled
    fullyScrolled =
      Math.abs(this.scrollHeight - this.clientHeight - this.scrollTop) <= 1;
  }

  function scrollToBottom() {
    var duration = 300;
    if (fullyScrolled) animateScroll(duration);
  }

  var observer = new MutationObserver(scrollToBottom);
  var config = { childList: true };
  observer.observe(element, config);
  element.scrollTop = element.scrollHeight;
  element.addEventListener("scroll", onScroll);
  return () => {
    observer.disconnect();
    element.removeEventListener("scroll", onScroll);
  };
}
