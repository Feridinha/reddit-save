// ==UserScript==
// @name         Reddit saver
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Quick download button for reddit posts
// @author       Feridinha
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tampermonkey.net
// @updateURL    https://raw.githubusercontent.com/Feridinha/reddit-save/main/tampermonkey.user.js
// @domain       raw.githubusercontent.com
// @grant        none
// @match https://*/*
// ==/UserScript==

const apiUrl = "https://reddit-save.feridinha.com?url="

const handleClick = (redditUrl) => async () => {
    const response = await fetch(apiUrl + redditUrl, { method: "POST" })
    const json = await response.json()
    if (!json.success) return alert(json.message)
    window.open(json.data, "_blank")
}

const getDownloadButton = (link) => {
    const wrapper = document.createElement("div")
    const button = document.createElement("button")
    const { href } = link
    button.style.background = "#2222"
    button.style.margin = "0 .1rem"
    button.style.padding = ".5rem"
    button.style.height = "100%"
    button.innerText = "Download"
    button.onclick = handleClick(href)

    button.onmouseenter = (e) => {
        e.target.style.background = "#5555"
    }
    button.onmouseleave = (e) => {
        e.target.style.background = "#2222"
    }

    wrapper.appendChild(button)
    return wrapper
}

const handleArea = (area, link) => {
    if (area.style.background == "none") return
    area.style.background = "none"
    const button = getDownloadButton(link)
    area.insertBefore(button, area.lastChild)
}

const postsSelector = `#AppRouter-main-content > div > div > div:last-child > div:last-child > div:first-child > div:nth-child(5) > div > div > div > div:last-child > div:last-child`

const handleButtonAreas = () => {
    const postsLinks = document.querySelectorAll(
        `${postsSelector} > div:last-child > a:first-child`
    )
    const buttonsAreas = document.querySelectorAll(
        `${postsSelector} > div:last-child`
    )
    if (!postsLinks?.length) return
    buttonsAreas.forEach((post, index) => {
        const link = postsLinks[index]
        if (!link) return

        handleArea(post, link)
    })
}

;(function () {
    "use strict"
    const matches = /\b(?:www\.)?reddit\.com/.test(location)
    setInterval(handleButtonAreas, 500)
})()
