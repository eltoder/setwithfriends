// Modified from code by Heather Booker
// https://medium.com/@heatherbooker/how-to-auto-scroll-to-the-bottom-of-a-div-415e967e7a24

export default function autoscroll(element) {
  let timer = null,
    atBottom = true;

  function onScroll() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight#determine_if_an_element_has_been_totally_scrolled
      atBottom =
        Math.abs(this.scrollHeight - this.clientHeight - this.scrollTop) <= 1;
    }, 100);
  }

  function scrollToBottom() {
    if (atBottom) {
      element.scrollTop = element.scrollHeight;
    }
  }

  const observer = new MutationObserver(scrollToBottom);
  observer.observe(element, { childList: true });
  element.scrollTop = element.scrollHeight;
  element.addEventListener("scroll", onScroll);
  return () => {
    observer.disconnect();
    element.removeEventListener("scroll", onScroll);
    clearTimeout(timer);
  };
}
