export function renderAdvisorView() {
  return `
    <section class="panel">
      <h2>AI Business Advisor (Gemini)</h2>
      <div id="advisor-output" class="chat-box"></div>
      <form id="advisor-form" class="chat-form">
        <textarea required name="message" rows="3" placeholder="Ask in Urdu or English..."></textarea>
        <button class="btn">Ask advisor</button>
      </form>
    </section>
  `;
}
