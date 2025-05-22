// Content script that runs in the context of Canvas quiz pages

type QuestionType = 'multiple_choice' | 'matching' | 'dropdown';
interface Question {
  type: QuestionType;
  text: string;
  options?: string[];
  matches?: {
    term: string;
    definition: string;
  }[];
  correctAnswer?: string;
}

class QuizHelper {
  private questions: Question[] = [];
  private panelElement: HTMLDivElement | null = null;
  private isDragging = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  constructor() {
    console.log('QuizHelper initialized');
    this.initialize();
  }

  private async initialize(): Promise<void> {
    console.log('Current URL:', window.location.href);
    
    // Always create the answer panel
    this.createAnswerPanel();

    // Only extract questions and add Get Answers button on quiz pages
    if (window.location.href.includes('/quizzes/') && window.location.href.includes('/take')) {
      console.log('Quiz page detected - extracting questions');
      this.extractQuestions();

      // Show questions in the panel after extraction
      this.renderQuestions();
      
      // Add Get Answers button only on quiz pages
      this.addGetAnswersButton();

    } else {
      console.log('Not a quiz taking page - panel created but no questions extracted');
      // You might want to display a message in the panel here
      // indicating that it's not a quiz page.
      if (this.panelElement) {
        const message = document.createElement('p');
        message.textContent = 'Navigate to a quiz page to see questions.';
        message.style.cssText = 'font-style: italic; color: #555;';
        this.panelElement.appendChild(message);
      }
    }
  }

  // New helper method to render questions in the panel
  private renderQuestions(): void {
    if (!this.panelElement) return;

    // Clear previous question display if any
    this.panelElement.querySelectorAll('.question-item').forEach(el => el.remove());
    
    this.questions.forEach((question, index) => {
      const questionDiv = document.createElement('div');
      questionDiv.style.cssText = `
        margin-bottom: 20px;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 4px;
      `;
      questionDiv.classList.add('question-item');

      const questionText = document.createElement('p');
      questionText.textContent = `Q${index + 1}: ${question.text}`;
      questionText.style.cssText = `
        margin: 0 0 10px 0;
        font-weight: bold;
      `;
      questionDiv.appendChild(questionText);

      if (question.type === 'multiple_choice' && question.options) {
        const optionsList = document.createElement('ul');
        optionsList.style.cssText = `
          margin: 0;
          padding-left: 20px;
        `;
        question.options.forEach((option) => {
          const li = document.createElement('li');
          li.textContent = option;
          optionsList.appendChild(li);
        });
        questionDiv.appendChild(optionsList);
      } else if (question.type === 'matching' && question.matches) {
        const matchesList = document.createElement('ul');
        matchesList.style.cssText = `
          margin: 0;
          padding-left: 20px;
        `;
        question.matches.forEach((match) => {
          const li = document.createElement('li');
          li.textContent = `${match.term} → ${match.definition}`;
          matchesList.appendChild(li);
        });
        questionDiv.appendChild(matchesList);
      } else if (question.type === 'dropdown' && question.options) {
        const optionsList = document.createElement('ul');
        optionsList.style.cssText = `
          margin: 0;
          padding-left: 20px;
        `;
        question.options.forEach((option) => {
          const li = document.createElement('li');
          li.textContent = option;
          optionsList.appendChild(li);
        });
        questionDiv.appendChild(optionsList);

        // Display the correct answer if available (from initial scrape, might not be on quiz page)
        if (question.correctAnswer) {
          const correctAnswerElement = document.createElement('p');
          correctAnswerElement.textContent = `Correct Answer (Scraped): ${question.correctAnswer}`;
          correctAnswerElement.style.cssText = `
            margin: 10px 0 0 0;
            font-weight: bold;
            color: green;
          `;
          questionDiv.appendChild(correctAnswerElement);
        }
      }

      this.panelElement!.appendChild(questionDiv);
    });
  }

  // New helper method to add the Get Answers button
  private addGetAnswersButton(): void {
    if (!this.panelElement) return;

    // Check if button already exists to avoid duplicates
    if (this.panelElement.querySelector('.get-answers-button')) return;

    const getAnswersButton = document.createElement('button');
    getAnswersButton.textContent = 'Get Answers';
    getAnswersButton.classList.add('get-answers-button'); // Add class for selection
    getAnswersButton.style.cssText = `
      display: block;
      width: 100%;
      padding: 10px;
      margin-top: 15px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
    `;
    getAnswersButton.onclick = () => this.fetchAnswers();
    this.panelElement.appendChild(getAnswersButton);
  }

  private extractQuestions(): void {
    console.log('Extracting questions...');
    const questionElements = document.querySelectorAll('.question');
    console.log('Found question elements:', questionElements.length);
    
    this.questions = []; // Clear previous questions

    questionElements.forEach((element) => {
      const questionType = this.getQuestionType(element);
      const questionText = this.getQuestionText(element);
      console.log('Question type:', questionType, 'Text:', questionText);

      // We will add the rendering of questions to a separate method
      // just extract the data here.

      if (questionType === 'multiple_choice') {
        const options = this.getMultipleChoiceOptions(element);
        console.log('Multiple choice options:', options);
        this.questions.push({
          type: 'multiple_choice',
          text: questionText,
          options,
        });
      } else if (questionType === 'matching') {
        const matches = this.getMatchingPairs(element);
        console.log('Matching pairs:', matches);
        this.questions.push({
          type: 'matching',
          text: questionText,
          matches,
        });
      }

      // Handle dropdown (select) questions
      const selectElements = element.querySelectorAll('select');
      if (selectElements.length > 0) {
        selectElements.forEach((select, idx) => {
          const options = Array.from(select.querySelectorAll('option'))
            .map(opt => opt.textContent?.trim() || '')
            .filter(opt => opt.length > 0);
          // Try to get the label or prompt for this dropdown
          let prompt = '';
          // Look for a label associated with the select
          const label = element.querySelector(`label[for='${select.id}']`);
          if (label) {
            prompt = label.textContent?.trim() || '';
          } else {
            // Fallback: use question text or index
            prompt = questionText ? `${questionText} (Dropdown ${idx + 1})` : `Dropdown ${idx + 1}`;
          }

          // Attempt to find the correct answer for this dropdown
          // This part is an educated guess based on typical Canvas structure.
          // We'll look for a sibling element that might contain the correct answer.
          let correctAnswer = undefined;
          const answerElement = select.closest('.question_content')?.querySelector('.correct_answer'); // Example selector, might need adjustment
          if (answerElement) {
            correctAnswer = answerElement.textContent?.trim() || '';
          }

          this.questions.push({
            type: 'dropdown',
            text: prompt,
            options,
            correctAnswer
          });
        });
      }
    });
  }

  private getQuestionType(element: Element): string {
    if (element.classList.contains('multiple_choice_question')) {
      return 'multiple_choice';
    } else if (element.classList.contains('matching_question')) {
      return 'matching';
    }
    return 'unknown';
  }

  private getQuestionText(element: Element): string {
    const questionTextElement = element.querySelector('.question_text');
    return questionTextElement?.textContent?.trim() || '';
  }

  private getMultipleChoiceOptions(element: Element): string[] {
    const options: string[] = [];
    const optionElements = element.querySelectorAll('.answer');
    optionElements.forEach((option) => {
      const text = option.textContent?.trim() || '';
      if (text) options.push(text);
    });
    return options;
  }

  private getMatchingPairs(element: Element): { term: string; definition: string }[] {
    const matches: { term: string; definition: string }[] = [];
    const termElements = element.querySelectorAll('.matching_term');
    const definitionElements = element.querySelectorAll('.matching_definition');
    termElements.forEach((term, index) => {
      const definition = definitionElements[index];
      if (term && definition) {
        matches.push({
          term: term.textContent?.trim() || '',
          definition: definition.textContent?.trim() || '',
        });
      }
    });
    return matches;
  }

  private createAnswerPanel(): void {
    const panel = document.createElement('div');
    this.panelElement = panel;
    panel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 350px;
      max-height: 80vh;
      background: white;
      border: 1px solid #ccc;
      border-radius: 8px;
      padding: 15px;
      z-index: 9999;
      overflow-y: auto;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      cursor: move; /* Indicate draggable area */
    `;

    const title = document.createElement('h3');
    title.textContent = 'Quiz Helper';
    title.style.cssText = `
      margin: 0 0 15px 0;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
      cursor: move; /* Indicate draggable area */
    `;
    panel.appendChild(title);

    // The question rendering and Get Answers button will be added
    // conditionally in the initialize method.

    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      border: none;
      background: none;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      line-height: 24px;
      text-align: center;
      border-radius: 50%;
    `;
    closeButton.onclick = () => panel.remove();
    panel.appendChild(closeButton);

    // Add Manual Question Section
    const manualQuestionSection = document.createElement('div');
    manualQuestionSection.style.cssText = `
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid #eee;
    `;
    const manualQuestionLabel = document.createElement('p');
    manualQuestionLabel.textContent = 'Enter a question manually:';
    manualQuestionLabel.style.cssText = 'font-weight: bold; margin-bottom: 5px;';
    manualQuestionSection.appendChild(manualQuestionLabel);

    const manualQuestionTextArea = document.createElement('textarea');
    manualQuestionTextArea.style.cssText = `
      width: 100%;
      height: 80px;
      margin-bottom: 10px;
      padding: 5px;
      border: 1px solid #ccc;
      border-radius: 4px;
      resize: vertical;
      box-sizing: border-box; /* Include padding and border in width */
    `;
    manualQuestionSection.appendChild(manualQuestionTextArea);

    const submitManualQuestionButton = document.createElement('button');
    submitManualQuestionButton.textContent = 'Submit Manual Question';
    submitManualQuestionButton.style.cssText = `
      display: block;
      width: 100%;
      padding: 10px;
      background-color: #28a745; /* Green button */
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
    `;
    submitManualQuestionButton.onclick = () => this.handleManualQuestion(manualQuestionTextArea.value);
    manualQuestionSection.appendChild(submitManualQuestionButton);

    const manualAnswerArea = document.createElement('div');
    manualAnswerArea.classList.add('manual-answer-area'); // Add class for targeting
    manualAnswerArea.style.cssText = `
      margin-top: 10px;
      padding: 10px;
      background-color: #e9ecef;
      border-radius: 4px;
      display: none; /* Hidden initially */
    `;
    manualQuestionSection.appendChild(manualAnswerArea);

    panel.appendChild(manualQuestionSection);

    document.body.appendChild(panel);

    // Add dragging functionality
    panel.addEventListener('mousedown', (e) => {
        // Check if the click is on the title bar or the panel itself (excluding buttons)
        if (e.target === panel || e.target === title) {
            this.isDragging = true;
            this.dragOffsetX = e.clientX - panel.getBoundingClientRect().left;
            this.dragOffsetY = e.clientY - panel.getBoundingClientRect().top;
            panel.style.cursor = 'grabbing';
        }
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isDragging || !this.panelElement) return;

      const newX = e.clientX - this.dragOffsetX;
      const newY = e.clientY - this.dragOffsetY;

      this.panelElement.style.left = `${newX}px`;
      this.panelElement.style.top = `${newY}px`;
      this.panelElement.style.right = 'auto'; // Override right position
      this.panelElement.style.bottom = 'auto'; // Override bottom position
    });

    document.addEventListener('mouseup', () => {
      if (this.isDragging && this.panelElement) {
        this.isDragging = false;
        this.panelElement.style.cursor = 'move';
      }
    });
  }

  private async handleManualQuestion(questionText: string): Promise<void> {
    if (!this.panelElement) return;

    const manualAnswerArea = this.panelElement.querySelector('.manual-answer-area') as HTMLElement;
    if (!manualAnswerArea) return;

    // Clear previous content and show loading
    manualAnswerArea.innerHTML = '';
    manualAnswerArea.style.display = 'block';
    manualAnswerArea.textContent = 'Fetching answer...';
    manualAnswerArea.style.color = 'gray';
    manualAnswerArea.style.fontStyle = 'italic';

    if (!questionText.trim()) {
      manualAnswerArea.textContent = 'Please enter a question.';
      manualAnswerArea.style.color = 'orange';
      manualAnswerArea.style.fontStyle = 'normal';
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/getAnswer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stem: questionText, options: [] }), // Send as structured data
      });

      manualAnswerArea.style.fontStyle = 'normal'; // Remove italic on completion

      if (!response.ok) {
        console.error('Error fetching manual answer:', response.status, response.statusText);
        manualAnswerArea.textContent = `Error: Could not get answer (${response.status})`;
        manualAnswerArea.style.color = 'red';
        return;
      }

      const data = await response.json();
      const answer = data.answer;

      if (answer) {
        manualAnswerArea.textContent = `Answer: ${answer}`; // Label the answer
        manualAnswerArea.style.color = 'green';
      } else {
        console.warn('Backend returned no answer for manual question');
        manualAnswerArea.textContent = 'No answer found.';
        manualAnswerArea.style.color = 'orange';
      }

    } catch (error) {
      console.error('Network error fetching manual answer:', error);
      manualAnswerArea.textContent = 'Network error fetching answer.';
      manualAnswerArea.style.color = 'red';
    }
  }

  private async fetchAnswers(): Promise<void> {
    if (!this.panelElement) return;

    const questionsInPanel = this.panelElement.querySelectorAll('.question-item');

    for (const [index, questionElement] of Array.from(questionsInPanel).entries()) {
      // Extract question stem and options separately from the panel's HTML structure
      const questionStemElement = questionElement.querySelector('p:first-child');
      const optionListElements = questionElement.querySelectorAll('ul li'); // Select all list items under ul

      const questionStem = questionStemElement?.textContent?.replace(/^Q\d+:\s*/, '').trim() || '';
      const options = Array.from(optionListElements).map(li => li.textContent?.trim()).filter(Boolean);

      // Construct the data to send to the backend
      const questionData = {
        stem: questionStem,
        options: options
      };

      if (!questionStem && options.length === 0) {
        console.warn(`Could not extract relevant content for question ${index + 1}`);
        continue;
      }

      console.log('Sending question data to backend:', questionData);

      // Remove any previous answer, error, or loading messages for this question
      questionElement.querySelectorAll('.loading-indicator, .answer-text, .error-text').forEach(el => el.remove());

      // Add a loading indicator
      const loadingIndicator = document.createElement('p');
      loadingIndicator.textContent = 'Fetching answer...';
      loadingIndicator.style.cssText = 'font-style: italic; color: gray;';
      loadingIndicator.classList.add('loading-indicator');
      questionElement.appendChild(loadingIndicator);

      try {
        const response = await fetch('http://localhost:3001/getAnswer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(questionData),
        });

        // Remove loading indicator
        loadingIndicator.remove();

        if (!response.ok) {
          console.error(`Error fetching answer for question ${index + 1}:`, response.status, response.statusText);
          const errorElement = document.createElement('p');
          errorElement.textContent = `Error: Could not get answer (${response.status})`;
          errorElement.style.cssText = 'color: red;';
          errorElement.classList.add('error-text');
          questionElement.appendChild(errorElement);
          continue;
        }

        const data = await response.json();
        const answer = data.answer;

        if (answer) {
          const answerElement = document.createElement('p');
          answerElement.textContent = `Answer: ${answer}`;
          answerElement.style.cssText = `
            margin-top: 10px;
            font-weight: bold;
            color: green;
          `;
          answerElement.classList.add('answer-text');
          questionElement.appendChild(answerElement);
        } else {
          console.warn(`Backend returned no answer for question ${index + 1}`);
          const noAnswerElement = document.createElement('p');
          noAnswerElement.textContent = 'No answer found.';
          noAnswerElement.style.cssText = 'color: orange;';
          noAnswerElement.classList.add('answer-text');
          questionElement.appendChild(noAnswerElement);
        }

      } catch (error) {
        console.error(`Network error fetching answer for question ${index + 1}:`, error);
        // Remove loading indicator if still present from network error
        if (loadingIndicator && loadingIndicator.parentElement) {
          loadingIndicator.remove();
        }
        const networkErrorElement = document.createElement('p');
        networkErrorElement.textContent = 'Network error fetching answer.';
        networkErrorElement.style.cssText = 'color: red;';
        networkErrorElement.classList.add('error-text');
        questionElement.appendChild(networkErrorElement);
      }
    }
  }
}

console.log('Content script loaded');
new QuizHelper(); 