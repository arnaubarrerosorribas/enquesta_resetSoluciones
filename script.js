document.addEventListener('DOMContentLoaded', function () {
    const languageSelector = document.getElementById('language');
    const surveyContainer = document.getElementById('survey-container');
    const paginationControls = document.getElementById('pagination-controls');

    let surveyData = null;
    let currentLanguage = null;
    let currentSectionIndex = 0;
    let sections = [];

    // Cargar los datos del JSON
    fetch('llistat.json')
        .then(response => response.json())
        .then(data => {
            surveyData = data[0].idiomas;
            console.log('Datos de la encuesta cargados:', surveyData);
        })
        .catch(error => {
            console.error('Error al cargar el JSON:', error);
            surveyContainer.innerHTML = '<p>Error al cargar la encuesta. Por favor, recarga la página.</p>';
        });

    // Manejar el cambio de idioma
    languageSelector.addEventListener('change', function () {
        currentLanguage = this.value;
        currentSectionIndex = 0;

        if (!currentLanguage) {
            surveyContainer.innerHTML = '';
            paginationControls.innerHTML = '';
            return;
        }

        if (!surveyData) {
            surveyContainer.innerHTML = '<p>Cargando encuesta...</p>';
            return;
        }

        initializeSurvey();
    });

    function initializeSurvey() {
        const languageData = surveyData[currentLanguage];
        if (!languageData) {
            surveyContainer.innerHTML = '<p>No se encontraron datos para el idioma seleccionado.</p>';
            return;
        }

        sections = languageData.contenido.secciones;
        renderSurveySection();
        renderPaginationControls();
        renderSectionNavigation();
    }

    function renderSurveySection() {
        if (currentSectionIndex >= sections.length) {
            // Mostrar resumen o finalización
            showCompletionPage();
            return;
        }

        const section = sections[currentSectionIndex];
        const languageData = surveyData[currentLanguage];
        const content = languageData.contenido;

        let html = `
            <div class="survey-title">${content.título}</div>
            <div class="introduction">
                ${content.introducción.map(p => `<p>${p}</p>`).join('')}
            </div>
            
            <div class="progress-indicator">
                Sección ${currentSectionIndex + 1} de ${sections.length}: ${section.subtítulo}
            </div>
            
            <div class="section">
                <h3 class="section-title">${section.subtítulo}</h3>
        `;

        section.preguntas.forEach(question => {
            html += `
                <div class="question">
                    <div class="question-text">
                        ${question.pregunta}
                        ${question.obligatorio ? '<span class="required">*</span>' : ''}
                    </div>
                    ${question.filtrar_fecha_alta ? `<div class="filter-note">(Aplica solo para personal con fecha de alta ${question.filtrar_fecha_alta})</div>` : ''}
                    ${renderQuestionOptions(question, content.respuestas_comunes)}
                </div>
            `;
        });

        html += `</div>`;

        surveyContainer.innerHTML = html;
    }

    function renderSectionNavigation() {
        const languageData = surveyData[currentLanguage];
        const content = languageData.contenido;

        let navHtml = '<div class="section-navigation">';

        navHtml += '</div>';

        // Insertar la navegación al principio del contenedor
        surveyContainer.insertAdjacentHTML('afterbegin', navHtml);

        // Añadir event listeners a los botones de navegación
        document.querySelectorAll('.section-nav-button').forEach(button => {
            button.addEventListener('click', function () {
                currentSectionIndex = parseInt(this.getAttribute('data-section'));
                renderSurveySection();
                renderPaginationControls();
                updateSectionNavigation();
            });
        });
    }

    function updateSectionNavigation() {
        document.querySelectorAll('.section-nav-button').forEach((button, index) => {
            if (index === currentSectionIndex) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    function renderPaginationControls() {
        let controlsHtml = '';

        if (currentSectionIndex > 0) {
            controlsHtml += `<button id="prev-btn">Anterior</button>`;
        } else {
            controlsHtml += `<button disabled>Anterior</button>`;
        }

        controlsHtml += `<span class="progress-indicator">Sección ${currentSectionIndex + 1} de ${sections.length}</span>`;

        if (currentSectionIndex < sections.length - 1) {
            controlsHtml += `<button id="next-btn">Siguiente</button>`;
        } else {
            controlsHtml += `<button id="submit-btn">Enviar Encuesta</button>`;
        }

        paginationControls.innerHTML = controlsHtml;

        // Añadir event listeners
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const submitBtn = document.getElementById('submit-btn');

        if (prevBtn) {
            prevBtn.addEventListener('click', goToPreviousSection);
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', goToNextSection);
        }

        if (submitBtn) {
            submitBtn.addEventListener('click', submitSurvey);
        }
    }

    function goToPreviousSection() {
        if (currentSectionIndex > 0) {
            currentSectionIndex--;
            renderSurveySection();
            renderPaginationControls();
            updateSectionNavigation();
        }
    }

    function goToNextSection() {
        if (validateCurrentSection()) {
            if (currentSectionIndex < sections.length - 1) {
                currentSectionIndex++;
                renderSurveySection();
                renderPaginationControls();
                updateSectionNavigation();
            }
        } else {
            alert('Por favor, responde todas las preguntas obligatorias antes de continuar.');
        }
    }

    function validateCurrentSection() {
        const currentSection = sections[currentSectionIndex];
        let isValid = true;

        currentSection.preguntas.forEach(question => {
            if (question.obligatorio) {
                const questionName = `q${question.código}`;
                const inputs = document.querySelectorAll(`input[name="${questionName}"], textarea[name="${questionName}"]`);

                let hasAnswer = false;

                inputs.forEach(input => {
                    if (input.type === 'radio' || input.type === 'checkbox') {
                        if (input.checked) hasAnswer = true;
                    } else if (input.type === 'textarea' || input.type === 'text') {
                        if (input.value.trim() !== '') hasAnswer = true;
                    }
                });

                if (!hasAnswer) isValid = false;
            }
        });

        return isValid;
    }

    function showCompletionPage() {
        const languageData = surveyData[currentLanguage];
        const content = languageData.contenido;

        let html = `
            <div class="completion-page">
                <h2>¡Gracias por completar la encuesta!</h2>
                <div class="footer">
                    ${content.texto_final.map(p => `<p>${p}</p>`).join('')}
                </div>
            </div>
        `;

        surveyContainer.innerHTML = html;
        paginationControls.innerHTML = '';
    }

    function submitSurvey() {
        if (validateCurrentSection()) {
            // Aquí iría la lógica para enviar las respuestas
            // Por ahora simplemente mostramos la página de finalización
            currentSectionIndex = sections.length;
            showCompletionPage();
        } else {
            alert('Por favor, responde todas las preguntas obligatorias antes de enviar la encuesta.');
        }
    }

    function renderQuestionOptions(question, commonAnswers) {
        const answerType = question.tipo_respuesta;
        const answers = commonAnswers[answerType];

        if (answerType === 'texto_libre') {
            return `<textarea class="text-input" rows="3" name="q${question.código}" 
                     ${question.obligatorio ? 'required' : ''}></textarea>`;
        }

        if (!answers) {
            return '<p>Error: tipo de respuesta no válido</p>';
        }

        let optionsHtml = '<div class="options">';

        answers.forEach((answer, index) => {
            const inputId = `q${question.código}_opt${index}`;
            optionsHtml += `
                <div class="option">
                    <input type="radio" id="${inputId}" name="q${question.código}" value="${index}" 
                           ${question.obligatorio ? 'required' : ''}>
                    <label for="${inputId}">${answer}</label>
                </div>
            `;
        });

        optionsHtml += '</div>';
        return optionsHtml;
    }
});