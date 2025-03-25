document.addEventListener('DOMContentLoaded', function () {
    const languageSelector = document.getElementById('languageSelector');
    const surveyContainer = document.getElementById('surveyContainer');
    let surveyData = null;

    // Cargar el JSON externo
    fetch('llistat.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('No se pudo cargar el archivo JSON');
            }
            console.log(response)
            return response.json();
        })
        .then(data => {
            surveyData = data;
            populateLanguageSelector();
        })
        .catch(error => {
            surveyContainer.innerHTML = `<p class="error">Error al cargar los datos: ${error.message}</p>`;
            console.error('Error:', error);
        });

        function populateLanguageSelector() {
            if (!surveyData || !surveyData[0] || !surveyData[0].idiomes) {  // Cambiado a idiomes
                return;
            }
        
            const languages = Object.keys(surveyData[0].idiomes);
            languages.forEach(lang => {
                const option = document.createElement('option');
                option.value = lang;
                option.textContent = surveyData[0].idiomes[lang].nom_idioma;  // Cambiado a nom_idioma
                languageSelector.appendChild(option);
            });
        }

    languageSelector.addEventListener('change', function () {
        const selectedLanguage = this.value;
        if (!selectedLanguage) {
            surveyContainer.innerHTML = '<p class="loading">Selecciona un idioma para cargar la encuesta</p>';
            return;
        }

        displaySurvey(selectedLanguage);
    });

    function displaySurvey(language) {
        if (!surveyData || !surveyData[0] || !surveyData[0].idiomes[language]) {  // Cambiado a idiomes
            surveyContainer.innerHTML = '<p class="error">No se encontraron datos para el idioma seleccionado</p>';
            return;
        }
    
        const survey = surveyData[0].idiomes[language].contingut;
        let html = `<h2 class="survey-title">${survey.titulo}</h2>`;

        // Introducción
        html += '<div class="intro-text">';
        survey.introduccion.forEach(text => {
            html += `<p>${text}</p>`;
        });
        html += '</div>';

        // Secciones
        survey.secciones.forEach(section => {
            html += `<div class="section">
                        <h3 class="section-title">${section.subtitulo}</h3>`;

            // Preguntas
            section.preguntas.forEach(question => {
                html += `<div class="question">
                            <div>
                                <span class="question-code">${question.codigo}.</span>
                                ${question.pregunta}
                                ${question.obligatoria ? '<span class="required">(Obligatoria)</span>' : ''}
                            </div>`;

                // Mostrar opciones de respuesta si no es texto libre
                if (question.tipo_respuesta !== 'texto_libre') {
                    const options = survey.respuestas_comunes[question.tipo_respuesta];
                    if (options) {
                        html += '<div class="options">';
                        options.forEach(option => {
                            html += `<div class="option">
                                        <input type="radio" name="q${question.codigo}" id="q${question.codigo}_${option}">
                                        <label for="q${question.codigo}_${option}">${option}</label>
                                    </div>`;
                        });
                        html += '</div>';
                    }
                } else {
                    html += '<div class="options">';
                    html += `<textarea rows="4" style="width: 100%;"></textarea>`;
                    html += '</div>';
                }

                html += '</div>'; // Cierre de pregunta
            });

            html += '</div>'; // Cierre de sección
        });

        // Texto final
        html += '<div class="final-text">';
        survey.texto_final.forEach(text => {
            html += `<p>${text}</p>`;
        });
        html += '</div>';

        surveyContainer.innerHTML = html;
    }
});