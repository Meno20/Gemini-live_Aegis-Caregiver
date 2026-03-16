"use client";

import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Patient } from "@/types/dashboard";

interface CareTeamPanelProps {
  patient: Patient;
}

export function CareTeamPanel({ patient }: CareTeamPanelProps) {
  const caregivers = [
    { name: "Susan Thompson", relation: "Daughter", role: "Primary Caregiver", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face" },
    { name: "Dr. Sarah Chen", relation: "Physician", role: "Geriatric Specialist", avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face" },
    { name: "Maria Garcia", relation: "Nurse", role: "Home Health Aide", avatar: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100&h=100&fit=crop&crop=face" },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-500" />
            Care Team for {patient.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {caregivers.map((caregiver, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-lg border bg-card">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={caregiver.avatar} />
                  <AvatarFallback>{caregiver.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{caregiver.name}</p>
                  <p className="text-sm text-muted-foreground">{caregiver.role}</p>
                  <Badge variant="outline" className="mt-1 text-xs">{caregiver.relation}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={caregivers[0].avatar} />
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{caregivers[0].name}</p>
              <p className="text-sm text-muted-foreground">(555) 123-4567</p>
            </div>
            <Button size="sm" variant="outline">Contact</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
