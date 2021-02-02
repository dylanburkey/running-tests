/// <reference types="Cypress" />

// run tests
// Command line: `$(npm bin)/cypress run`
// UI: `node_modules/.bin/cypress open`

context('Actions', () => {


  beforeEach(() => {
    cy.visit('/')
    cy.injectAxe()
  })

  // https://on.cypress.io/interacting-with-elements
  

  it('Open homepage', () => {
    // https://on.cypress.io/type
    cy.get('h1')
      .should('contain', '🌵 juckWonder 🌵')
  })

  it('Has no detectable a11y violations on load', () => {
    // Test the page at initial load
    // cy.configureAxe({
    //   rules: {}
    // })
    cy.checkA11y()
  })
 
})
