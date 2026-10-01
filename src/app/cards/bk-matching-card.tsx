import React, { useState, useEffect } from "react";
import {
  Text,
  Flex,
  Box,
  Tag,
  Alert,
  LoadingSpinner,
  Link,
  Divider,
  EmptyState,
  Image,
  StatusTag,
  Tile,
  Panel,
  PanelBody,
  PanelSection,
  DescriptionList,
  DescriptionListItem,
  Button,
  Toggle,
  Heading,
} from "@hubspot/ui-extensions";
import { hubspot } from "@hubspot/ui-extensions";

const API_BASE = "https://bp-matching-api.vercel.app";

const STAR_DISPLAY: Record<number, string> = {
  1: "★☆☆☆☆",
  2: "★★☆☆☆",
  3: "★★★☆☆",
  4: "★★★★☆",
  5: "★★★★★",
};

interface BKResult {
  contactId: string;
  name: string;
  score: number;
  stars: number;
  kategorie: string;
  deutsch: string;
  verfuegbarAb: string;
  agentur: string;
  erfahrungen: string[];
  avatarUrl: string;
  einsatzStatus: "frei" | "geplant" | "laeuft";
  link: string;
}

interface BKProfil {
  anrede: string;
  vorname: string;
  nachname: string;
  spitzname: string;
  geburtsdatum: string;
  alter: string;
  familienstand: string;
  kinder: string;
  land: string;
  email: string;
  handynummer: string;
  beschreibung: string;
  kategorie: string;
  deutschkenntnisse: string;
  verfuegbarAb: string;
  raucher: string;
  zigarettenAmTag: string;
  fuehrerschein: string;
  pflegeerfahrungJahre: string;
  erfahrung: string;
  transferKg: string;
  anzahlPflegebedurftige: string;
  letzteEinsaetze: string;
  ausbildungen: string;
  sonstigeAusbildung: string;
  zertifikate: string;
}

interface BKDetails {
  contactId: string;
  agentur: string;
  profil: BKProfil;
  link: string;
}

interface MatchResponse {
  results: BKResult[];
  empty?: boolean;
  message?: string;
  meta?: {
    totalBKs: number;
    shown: number;
    dealComplete: boolean;
    kategorie?: string;
  };
  error?: string;
}

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "–";
  try {
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
};

const formatDeutsch = (value: string): string => {
  if (!value) return "–";
  const clean = value.replace(/_/g, " ");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

const getStatusTag = (
  status: string
): { label: string; variant: "success" | "warning" | "danger" } => {
  switch (status) {
    case "laeuft":
      return { label: "Im Einsatz", variant: "danger" };
    case "geplant":
      return { label: "Geplant", variant: "warning" };
    default:
      return { label: "Frei", variant: "success" };
  }
};

const formatJaNein = (value: string): string => {
  if (!value) return "";
  const v = value.toLowerCase().trim();
  if (v === "false" || v === "0" || v === "nein") return "Nein";
  if (v === "true" || v === "1" || v === "ja") return "Ja";
  return value;
};

const getScoreVariant = (
  score: number
): "success" | "warning" | "error" => {
  if (score > 75) return "success";
  if (score >= 51) return "warning";
  return "error";
};

// Detail-Panel als eigene Komponente mit on-demand Loading
function BKDetailPanel({ bk }: { bk: BKResult }) {
  const [details, setDetails] = useState<BKDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const res = await hubspot.fetch(
          `${API_BASE}/api/bk-details?contactId=${bk.contactId}`
        );
        const json = await res.json();
        if (json.error) {
          setError(json.error);
        } else {
          setDetails(json);
        }
      } catch (err: any) {
        setError(err.message || "Fehler beim Laden der Details");
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [bk.contactId]);

  if (loading) {
    return (
      <PanelBody>
        <PanelSection>
          <Flex direction="column" align="center" gap="sm">
            <LoadingSpinner label="Details werden geladen…" />
          </Flex>
        </PanelSection>
      </PanelBody>
    );
  }

  if (error || !details) {
    return (
      <PanelBody>
        <PanelSection>
          <Alert title="Fehler" variant="error">
            {error || "Details konnten nicht geladen werden"}
          </Alert>
        </PanelSection>
      </PanelBody>
    );
  }

  const { profil } = details;

  return (
    <PanelBody>
      {/* Header: Foto + Info */}
      <PanelSection>
        <Flex direction="row" gap="md" align="start">
          {/* Links: Foto + Agentur + Score + Status */}
          <Box flex={1}>
            <Flex direction="column" gap="sm" align="start">
              {bk.avatarUrl && (
                <Image src={bk.avatarUrl} alt={bk.name} width={120} />
              )}
              {details.agentur && (
                <Heading>{details.agentur}</Heading>
              )}
              <Flex direction="row" gap="sm" align="center">
                <Tag variant={getScoreVariant(bk.score)}>{bk.score}%</Tag>
                {bk.stars > 0 && <Text>{STAR_DISPLAY[bk.stars]}</Text>}
                <StatusTag variant={getStatusTag(bk.einsatzStatus).variant}>
                  {getStatusTag(bk.einsatzStatus).label}
                </StatusTag>
              </Flex>
            </Flex>
          </Box>

        </Flex>
      </PanelSection>

      {/* Persönliche Daten — 2 Spalten */}
      <PanelSection>
        <Text format={{ fontWeight: "bold" }}>Persönliche Daten</Text>
        <Flex direction="row" gap="md">
          <Box flex={1}>
            <DescriptionList direction="column">
              {profil.anrede && (
                <DescriptionListItem label="Anrede">
                  <Text>{profil.anrede}</Text>
                </DescriptionListItem>
              )}
              <DescriptionListItem label="Vorname">
                <Text>{profil.vorname || "–"}</Text>
              </DescriptionListItem>
              <DescriptionListItem label="Nachname">
                <Text>{profil.nachname || "–"}</Text>
              </DescriptionListItem>
              {profil.spitzname && (
                <DescriptionListItem label="Spitzname">
                  <Text>{profil.spitzname}</Text>
                </DescriptionListItem>
              )}
              {profil.geburtsdatum && (
                <DescriptionListItem label="Geburtsdatum">
                  <Text>{formatDate(profil.geburtsdatum)}</Text>
                </DescriptionListItem>
              )}
              {profil.alter && (
                <DescriptionListItem label="Alter">
                  <Text>{profil.alter} Jahre</Text>
                </DescriptionListItem>
              )}
            </DescriptionList>
          </Box>
          <Box flex={1}>
            <DescriptionList direction="column">
              {profil.familienstand && (
                <DescriptionListItem label="Familienstand">
                  <Text>{profil.familienstand}</Text>
                </DescriptionListItem>
              )}
              {profil.kinder && (
                <DescriptionListItem label="Kinder">
                  <Text>{profil.kinder}</Text>
                </DescriptionListItem>
              )}
              {profil.land && (
                <DescriptionListItem label="Land">
                  <Text>{profil.land}</Text>
                </DescriptionListItem>
              )}
              {profil.email && (
                <DescriptionListItem label="E-Mail">
                  <Text>{profil.email}</Text>
                </DescriptionListItem>
              )}
              {profil.handynummer && (
                <DescriptionListItem label="Handynummer">
                  <Text>{profil.handynummer}</Text>
                </DescriptionListItem>
              )}
            </DescriptionList>
          </Box>
        </Flex>
        {profil.beschreibung && (
          <DescriptionList direction="column">
            <DescriptionListItem label="Über mich">
              <Text>{profil.beschreibung}</Text>
            </DescriptionListItem>
          </DescriptionList>
        )}
      </PanelSection>

      {/* Betreuungsprofil — 2 Spalten */}
      <PanelSection>
        <Text format={{ fontWeight: "bold" }}>Betreuungsprofil</Text>
        <Flex direction="row" gap="md">
          <Box flex={1}>
            <DescriptionList direction="column">
              <DescriptionListItem label="Kategorie">
                <Text>{profil.kategorie || "–"}</Text>
              </DescriptionListItem>
              <DescriptionListItem label="Deutschkenntnisse">
                <Text>{formatDeutsch(profil.deutschkenntnisse)}</Text>
              </DescriptionListItem>
              <DescriptionListItem label="Verfügbar ab">
                <Text>{formatDate(bk.verfuegbarAb)}</Text>
              </DescriptionListItem>
            </DescriptionList>
          </Box>
          <Box flex={1}>
            <DescriptionList direction="column">
              {profil.raucher && (
                <DescriptionListItem label="Raucher">
                  <Text>{formatJaNein(profil.raucher)}</Text>
                </DescriptionListItem>
              )}
              {profil.zigarettenAmTag && (
                <DescriptionListItem label="Zigaretten/Tag">
                  <Text>{profil.zigarettenAmTag}</Text>
                </DescriptionListItem>
              )}
              {profil.fuehrerschein && (
                <DescriptionListItem label="Führerschein">
                  <Text>{formatJaNein(profil.fuehrerschein)}</Text>
                </DescriptionListItem>
              )}
            </DescriptionList>
          </Box>
        </Flex>
      </PanelSection>

      {/* Ausbildung — 2 Spalten */}
      <PanelSection>
        <Text format={{ fontWeight: "bold" }}>Ausbildung</Text>
        <Flex direction="row" gap="md">
          <Box flex={1}>
            <DescriptionList direction="column">
              {profil.ausbildungen && (
                <DescriptionListItem label="Ausbildungen">
                  <Text>{profil.ausbildungen.replace(/;/g, ", ")}</Text>
                </DescriptionListItem>
              )}
              {profil.sonstigeAusbildung && (
                <DescriptionListItem label="Sonstige">
                  <Text>{profil.sonstigeAusbildung}</Text>
                </DescriptionListItem>
              )}
            </DescriptionList>
          </Box>
          <Box flex={1}>
            <DescriptionList direction="column">
              {profil.zertifikate && (
                <DescriptionListItem label="Zertifikate">
                  <Flex direction="row" gap="xs" wrap="wrap">
                    {profil.zertifikate.split(";").map((z: string) => (
                      <Tag key={z.trim()} variant="default">
                        {z.trim()}
                      </Tag>
                    ))}
                  </Flex>
                </DescriptionListItem>
              )}
            </DescriptionList>
          </Box>
        </Flex>
      </PanelSection>

      {/* Erfahrung — 1 Spalte */}
      <PanelSection>
        <Text format={{ fontWeight: "bold" }}>Erfahrung</Text>
        <DescriptionList direction="column">
          {profil.pflegeerfahrungJahre && (
            <DescriptionListItem label="Pflegeerfahrung">
              <Text>{profil.pflegeerfahrungJahre} Jahre</Text>
            </DescriptionListItem>
          )}
          <DescriptionListItem label="Erfahrungen">
            {profil.erfahrung ? (
              <Flex direction="row" gap="xs" wrap="wrap">
                {profil.erfahrung.split(";").map((erf: string) => (
                  <Tag key={erf.trim()} variant="default">
                    {erf.trim()}
                  </Tag>
                ))}
              </Flex>
            ) : (
              <Text>–</Text>
            )}
          </DescriptionListItem>
          {profil.transferKg && (
            <DescriptionListItem label="Transfer bis">
              <Text>{profil.transferKg} kg</Text>
            </DescriptionListItem>
          )}
          {profil.anzahlPflegebedurftige && (
            <DescriptionListItem label="Max. Pflegebedürftige">
              <Text>{profil.anzahlPflegebedurftige === "zwei" ? "Zwei" : "Eine"}</Text>
            </DescriptionListItem>
          )}
          {profil.letzteEinsaetze && (
            <DescriptionListItem label="Letzte Einsätze">
              <Flex direction="column" gap="flush">
                {profil.letzteEinsaetze.split("\n").map((line: string, i: number) => (
                  <Text key={i}>{line || "\u00A0"}</Text>
                ))}
              </Flex>
            </DescriptionListItem>
          )}
        </DescriptionList>
      </PanelSection>

      {/* Kontakt öffnen */}
      <PanelSection>
        <Link href={details.link}>
          <Button variant="primary" size="sm">
            Kontakt öffnen
          </Button>
        </Link>
      </PanelSection>
    </PanelBody>
  );
}

// Hauptkomponente
function BKMatchingCard({ context }: { context: any }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MatchResponse | null>(null);
  const [nurFreie, setNurFreie] = useState(false);

  const dealId = context?.crm?.objectId;

  const loadData = async () => {
    if (!dealId) {
      setError("Keine Deal-ID gefunden");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ dealId });
      if (nurFreie) params.set("nurFreie", "1");
      const res = await hubspot.fetch(
        `${API_BASE}/api/bk-match?${params}`
      );
      const json: MatchResponse = await res.json();

      if (json.error) {
        setError(json.error);
      } else {
        setData(json);
      }
    } catch (err: any) {
      setError(err.message || "Fehler beim Laden der Matching-Daten");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dealId, nurFreie]);

  if (loading) {
    return (
      <Flex direction="column" align="center" gap="sm">
        <LoadingSpinner label="Matching wird berechnet…" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Alert title="Fehler" variant="error">
        {error}
      </Alert>
    );
  }

  if (!data || data.empty) {
    return (
      <EmptyState title={data?.message || "Keine Daten"} layout="vertical">
        <Text>
          {data?.meta?.dealComplete === false
            ? "Bitte füllen Sie das Matching-Profil im Deal aus, um passende Betreuungskräfte zu finden."
            : "Es wurden keine passenden Betreuungskräfte gefunden."}
        </Text>
      </EmptyState>
    );
  }

  const { results, meta } = data;

  return (
    <Flex direction="column" gap="md">
      {/* Header */}
      <Flex direction="row" justify="between" align="center">
        <Text format={{ fontWeight: "bold" }}>
          BK Matching — {meta?.kategorie || ""}
        </Text>
        <Flex direction="row" gap="sm" align="center">
          <Toggle
            checked={nurFreie}
            label="Nur Freie"
            size="sm"
            onChange={(checked) => setNurFreie(checked)}
          />
          <Text variant="microcopy">
            {results.length} von {meta?.totalBKs} angezeigt
          </Text>
        </Flex>
      </Flex>

      <Divider />

      {/* Ergebnis-Tiles */}
      {results.map((bk) => (
        <Tile key={bk.contactId} compact={true}>
          {/* Obere Zeile */}
          <Flex direction="row" justify="between" align="center" gap="md">
            <Flex direction="row" gap="sm" align="center">
              {bk.avatarUrl && (
                <Image src={bk.avatarUrl} alt={bk.name} width={40} />
              )}
              <Link href={bk.link}>
                <Text format={{ fontWeight: "bold" }}>{bk.name}</Text>
              </Link>
              <Tag variant={getScoreVariant(bk.score)}>
                {bk.score}%
              </Tag>
              {bk.stars > 0 && (
                <Text>{STAR_DISPLAY[bk.stars]}</Text>
              )}
              <StatusTag variant={getStatusTag(bk.einsatzStatus).variant}>
                {getStatusTag(bk.einsatzStatus).label}
              </StatusTag>
            </Flex>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => {}}
              overlay={
                <Panel id={`panel-${bk.contactId}`} title={bk.name} width="md">
                  <BKDetailPanel bk={bk} />
                </Panel>
              }
            >
              Details
            </Button>
          </Flex>

          {/* Untere Zeile */}
          <Flex direction="row" gap="md" wrap="wrap" align="center">
            {bk.agentur && (
              <Text variant="microcopy">{bk.agentur}</Text>
            )}
            {bk.deutsch && (
              <Text variant="microcopy">Deutsch: {formatDeutsch(bk.deutsch)}</Text>
            )}
            {bk.verfuegbarAb && (
              <Text variant="microcopy">Verfügbar: {formatDate(bk.verfuegbarAb)}</Text>
            )}
            {bk.erfahrungen.length > 0 &&
              bk.erfahrungen.map((erf) => (
                <Tag key={erf} variant="default">
                  {erf}
                </Tag>
              ))}
          </Flex>
        </Tile>
      ))}
    </Flex>
  );
}

// HubSpot Entry Point
hubspot.extend<"crm.record.tab">(({ context }) => (
  <BKMatchingCard context={context} />
));
