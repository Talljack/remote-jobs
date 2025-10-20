import { Globe, Clock, Filter, DollarSign } from "lucide-react";
import { useTranslations } from "next-intl";

export function Features() {
  const t = useTranslations("home.features");

  const features = [
    {
      icon: Globe,
      title: t("aggregated.title"),
      description: t("aggregated.description"),
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Clock,
      title: t("realtime.title"),
      description: t("realtime.description"),
      gradient: "from-violet-500 to-purple-500",
    },
    {
      icon: Filter,
      title: t("smart.title"),
      description: t("smart.description"),
      gradient: "from-orange-500 to-red-500",
    },
    {
      icon: DollarSign,
      title: t("free.title"),
      description: t("free.description"),
      gradient: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <section className="relative py-24 lg:py-32">
      <div className="container">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {t("title")}
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group border-border bg-background relative overflow-hidden rounded-2xl border p-8 transition-all duration-300 hover:border-transparent hover:shadow-2xl"
            >
              {/* Gradient background on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-5`}
              />

              {/* Content */}
              <div className="relative">
                {/* Icon */}
                <div
                  className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} p-0.5 transition-transform duration-300 group-hover:scale-110`}
                >
                  <div className="bg-background flex h-full w-full items-center justify-center rounded-[10px]">
                    <feature.icon className="text-foreground h-6 w-6" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="mb-3 text-xl font-semibold">{feature.title}</h3>

                {/* Description */}
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Decorative corner */}
              <div
                className={`absolute -top-4 -right-4 h-24 w-24 rounded-full bg-gradient-to-br ${feature.gradient} opacity-10 blur-2xl transition-opacity duration-300 group-hover:opacity-20`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
