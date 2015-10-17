library(shiny)
shinyServer(function(input, output) {
  calcprob <- reactive({
    (e^0.240343)*(e^(-0.052698*input$Age))*( e^(0.458596*input$CKD))*( e^(0.236863*input$DM)) / (1 +(e^0.240343)*(e^(-0.052698*input$Age))*( e^(0.458596*input$CKD))*(e^(0.236863*input$DM)))
  })
  output$prob <- renderText({ 
    paste("TKA Revision Probability = ", round(100*calcprob(),1),"%")
  })
})
