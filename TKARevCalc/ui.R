shinyUI(fluidPage(theme = "bootstrap.css",
        titlePanel(h2("Total-Knee Arthroplasty Revision Probability Calculator", align="center")),
        fluidRow(
                column(4,
                       numericInput("Age", "Age (18-100)", value = NA, min = NA, max = NA, step = NA),
                       numericInput("BMI", "BMI (10-90)", value = NA, min = NA, max = NA, step = NA)
                ),
                column(4,
                       numericInput("MED", "Daily Morphine Equivalents (0-2500)", value = NA, min = NA, max = NA, step = NA),
                       helpText(a("Link to Morphine Equivalent Dose Calculator", href="http://agencymeddirectors.wa.gov/mobile.html", target="_blank"))
                ),
                column(4,
                       radioButtons("CKD", "Chronic Kidney Disease", choices = c("No", "Yes")),
                       radioButtons("DM", "Diabetes Mellitus", choices = c("No", "Yes"))
                )
        ),
        plotOutput('plot'),
        fluidRow(
                column(12,
                       h6("This model for predicting early TKA revision was generated from 34,000 VA patients (94% men) aged 24-96. Patients were followed for 1-7 years (median = 3.81 years). For further information regarding the methods to create this model, please see the manuscript:"),
                       em("pending publication")
                )
        )
))