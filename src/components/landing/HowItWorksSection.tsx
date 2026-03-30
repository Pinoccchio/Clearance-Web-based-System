"use client";

const STEPS = [
  {
    step: "01",
    title: "Sign In to Your Account",
    desc: "Your account is created by the school administrator. Use the Sign In button and select 'Forgot Password' to set your password for the first time before accessing your portal.",
  },
  {
    step: "02",
    title: "Initiate Your Clearance Request",
    desc: "Start a semester clearance request from your dashboard. The system automatically generates clearance items for your department, all school offices, the clubs you are enrolled in, and your student government (CSG or CSPSG depending on your program).",
  },
  {
    step: "03",
    title: "Submit Requirements Per Source",
    desc: "For each clearance source — department, office, club, LGU, or student government — upload the required documents or attachments. Some requirements are fulfilled automatically when staff scan your ID at an event using the attendance scanner — no upload needed for those.",
  },
  {
    step: "04",
    title: "View Your Completed Clearance",
    desc: "Once every department, office, club, LGU, and student government has approved your items, your overall clearance status becomes Completed. You are fully cleared for the semester.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-background py-24 lg:py-32">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16 fade-in-up">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            How It Works
          </h2>
        </div>

        {/* Timeline */}
        <div className="timeline-vertical">
          {STEPS.map((item, index) => (
            <div
              key={item.step}
              className={`timeline-step fade-in-up fade-in-up-delay-${index + 1}`}
            >
              <div className="timeline-number">{item.step}</div>
              <div className="timeline-card-expand bg-card rounded-xl p-6 shadow-sm border border-border">
                <h3 className="font-display font-bold text-foreground text-xl mb-3">
                  {item.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
