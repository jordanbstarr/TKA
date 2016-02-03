shinyServer(function(input, output) {
  CKD <- reactive({as.factor(ifelse(input$CKD == "No",0,1))})
  DM <- reactive({as.factor(ifelse(input$DM == "No",0,1))})
  x <- reactive({
        survfit(fit, newdata=data.frame(Age = input$Age, BMI = input$BMI, Diabetes = DM(), CKD = CKD(), MEDperDay = input$MED))
  })
  u <- reactive({
          unlist(x())
  })  
  m <- reactive({
          1 - u()$lower792
  })
  y <- reactive({
          ifelse(m() >= .8, 1, 1.25*m())
  })
  output$plot <- renderPlot({ 
          ifelse(input$Age < 18 | input$Age > 100 | !is.numeric(input$Age) | input$BMI < 10 | input$BMI > 90 | !is.numeric(input$BMI) | input$MED < 0 | input$MED > 2500 | !is.numeric(input$MED),"",plot(x(), mark.time=F, xlab="Years", cex.lab=1.25, ylab="TKA Revision Probability", main="Individual TKA Revision Probability", ylim=c(0,y()), fun="event", lwd = 2)) 
  })
}) 


