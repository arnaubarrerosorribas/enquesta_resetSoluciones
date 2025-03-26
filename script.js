document.addEventListener('DOMContentLoaded', function () {
    const languageSelector = document.getElementById('language');
    const surveyContainer = document.getElementById('survey-container');
    let surveyData = null;

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
        const selectedLanguage = this.value;

        if (!selectedLanguage) {
            surveyContainer.innerHTML = '';
            return;
        }

        if (!surveyData) {
            surveyContainer.innerHTML = '<p>Cargando encuesta...</p>';
            return;
        }

        displaySurvey(selectedLanguage);
    });

    function displaySurvey(language) {
        const languageData = surveyData[language];
        if (!languageData) {
            surveyContainer.innerHTML = '<p>No se encontraron datos para el idioma seleccionado.</p>';
            return;
        }

        const content = languageData.contenido;

        let html = `
            <div class="survey-title">${content.título}</div>
            <div class="introduction">
                ${content.introducción.map(p => `<p>${p}</p>`).join('')}
            </div>
        `;

        // Generar las secciones de preguntas
        content.secciones.forEach(section => {
            html += `
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
        });

        // Añadir el texto final
        html += `
            <div class="footer">
                ${content.texto_final.map(p => `<p>${p}</p>`).join('')}
            </div>
        `;

        surveyContainer.innerHTML = html;
    }

    function renderQuestionOptions(question, commonAnswers) {
        const answerType = question.tipo_respuesta;
        const answers = commonAnswers[answerType];

        if (answerType === 'texto_libre') {
            return `<textarea class="text-input" rows="3" ${question.obligatorio ? 'required' : ''}></textarea>`;
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