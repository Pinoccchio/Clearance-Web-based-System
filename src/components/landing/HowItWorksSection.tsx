"use client";

const STEPS = [
  {
    step: "01",
    title: "Create Your Account",
    desc: "Register using your student ID and school email. Set up your profile and select the organizations you belong to.",
  },
  {
    step: "02",
    title: "Submit Clearance Request",
    desc: "Start a clearance request for graduation, semester end, or transfer. The system will show all departments and organizations you need to clear.",
  },
  {
    step: "03",
    title: "Check Status and Settle Requirements",
    desc: "See which departments have approved you and which ones need action. Visit offices to settle any pending requirements like unpaid fees or unreturned books.",
  },
  {
    step: "04",
    title: "Get Your Clearance",
    desc: "Once all departments and organizations have approved you, download or print your official clearance certificate.",
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
