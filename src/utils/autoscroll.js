// Modified from code by Heather Booker
// https://medium.com/@heatherbooker/how-to-auto-scroll-to-the-bottom-of-a-div-415e967e7a24

export default function autoscroll(element) {
  let atBottom = true,
    lastAutoScroll = 0,
    timer = null;

  function onScroll() {
    clearTimeout(timer);
    const now = Date.now();
    if (now - lastAutoScroll < 100) {
      lastAutoScroll = now; // still auto-scrolling
    } else {
      timer = setTimeout(() => {
        // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight#determine_if_an_element_has_been_totally_scrolled
        atBottom =
          Math.abs(this.scrollHeight - this.clientHeight - this.scrollTop) <= 1;
      }, 100);
    }
  }

  element.scrollToBottom = () => {
    atBottom = true;
    lastAutoScroll = Date.now();
    element.scrollTop = element.scrollHeight;
  };

  const observer = new MutationObserver(() => {
    if (atBottom) {
      element.scrollToBottom();
    }
  });
  observer.observe(element, { childList: true });
  element.addEventListener("scroll", onScroll);
  element.scrollToBottom();
  return () => {
    observer.disconnect();
    element.removeEventListener("scroll", onScroll);
    clearTimeout(timer);
  };
}
