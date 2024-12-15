// ==UserScript==
// @name         Kirka.io Kill Feed Monitor v5
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Monitor kill feed in kirka.io with headshot detection and sound
// @author       Your Name
// @match        https://*.kirka.io/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let playerNickname = ''; // Variável para armazenar o nickname do jogador
    const HEADSHOT_SOUND = new Audio('https://www.myinstants.com/media/sounds/headshot_0.mp3');
    HEADSHOT_SOUND.volume = 0.1; // Ajusta o volume para 20% do máximo

    function getPlayerNickname() {
        try {
            // Usando XPath para pegar o nickname
            const xpath = "/html/body/div[1]/div[1]/div[5]/div[2]/div/div[2]/div[2]";
            const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            if (result.singleNodeValue) {
                playerNickname = result.singleNodeValue.textContent.trim();
                console.log(`%c[System] Player detected: ${playerNickname}`, 'color: #00ffff');
            } else {
                setTimeout(getPlayerNickname, 1000); // Tentar novamente em 1 segundo
            }
        } catch (error) {
            console.error('Error getting player nickname:', error);
            setTimeout(getPlayerNickname, 1000);
        }
    }

    function findKillFeedContainer() {
        const selectors = ['.kill-bar-cont', '[data-v-591e722e]'];
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) return element;
        }
        return null;
    }

    function playHeadshotSound() {
        HEADSHOT_SOUND.currentTime = 0; // Resetar o áudio caso já esteja tocando
        HEADSHOT_SOUND.play().catch(error => console.error('Error playing sound:', error));
    }

    function processKillElement(element) {
        try {
            const killerElement = element.querySelector('.killer-name');
            const victimElement = element.querySelector('.name-kill');
            const images = element.querySelectorAll('img');

            if (!killerElement || !victimElement) return;

            const killer = killerElement.textContent.trim();
            const victim = victimElement.textContent.trim();
            const isHeadshot = images.length >= 2;

            // Verificar se o killer é o jogador e se é headshot
            if (isHeadshot && killer === playerNickname) {
                // Tocar o som
                playHeadshotSound();

                // Mostrar no console
                console.log(
                    `%c${new Date().toLocaleTimeString()} %c${killer} %ckilled %c${victim} %c(headshot)`,
                    'color: #888',
                    'color: #00ff00',
                    'color: #fff',
                    'color: #ff4444',
                    'color: #ffff00; font-style: italic'
                );
            }
        } catch (error) {
            console.error('Error processing kill element:', error);
        }
    }

    function startMonitoring() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            if (node.classList.contains('kill-bar-item')) {
                                processKillElement(node);
                            }

                            const killItems = node.querySelectorAll('.kill-bar-item');
                            if (killItems.length > 0) {
                                killItems.forEach(processKillElement);
                            }
                        }
                    });
                }
            }
        });

        const config = {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        };

        function initializeObserver() {
            const container = findKillFeedContainer();
            if (container) {
                observer.observe(container, config);
            } else {
                setTimeout(initializeObserver, 1000);
            }
        }

        initializeObserver();
    }

    function initialize() {
        // Primeiro, pegar o nickname do jogador
        getPlayerNickname();

        // Depois iniciar o monitoramento
        if (document.readyState === 'complete') {
            startMonitoring();
        } else {
            window.addEventListener('load', startMonitoring);
        }
    }

    // Iniciar o script
    initialize();

    // Verificação periódica
    setInterval(() => {
        if (!playerNickname) {
            getPlayerNickname();
        }

        const container = findKillFeedContainer();
        if (!container) {
            startMonitoring();
        }
    }, 5000);

})();
