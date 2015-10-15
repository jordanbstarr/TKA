library(shiny)
shinyUI(fluidPage(
  titlePanel("TKA Revision Probability Calculator"),
  sidebarLayout(
    sidebarPanel(position = “left”,
      h5("Notice: Model for TKA revision prediction was generated from 34,000 VA patients, most of whom were adult males, followed for a median of 3.70 years. Please keep this population in mind when interpreting your results. For further information regarding the methods to create this model, please see this manuscript: paper citation."),
    ),
    mainPanel(align="center",
      numericInput(Age, "Age", value, min = 18, max = 120, step = NA),
      checkboxGroupInput(Comborb, "Comorbidities", c("Chronic Kidney Disease", "Diabetes Mellitus"), selected = NULL),
      actionButton("calc", "Calculate"),
      textOutput("prob")
    )
  )
))
