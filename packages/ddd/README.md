# @cdziv/devkit-ddd

English | [繁體中文](https://github.com/cdziv/devkit/blob/main/packages/ddd/README.zh-tw.md)

## Introduction

`@cdziv/devkit-ddd` helps you implement Domain-Driven Design (DDD) in your code, enabling the creation of applications with clear domain knowledge, readability, maintainability, and extensibility. It is framework-agnostic and does not rely on any ORM, allowing you to use it in your application as needed.

> **Tip**: This document assumes you have a basic understanding of DDD. If you are unfamiliar with DDD or unsure whether to adopt it in your application, [Eric Evans’ _Domain-Driven Design_](https://www.domainlanguage.com/ddd/) is an excellent starting point.

## Quick Start

In this section, we’ll walk through implementing a simple poker game example using the core features of this library at the domain layer.

### Installation

```bash
npm install @cdziv/devkit-ddd
```

### Value Objects

First, a player needs a username and a chip stack. We’ll design the username as a value object:

```ts
// Create a value object with a DomainPrimitive value
type UsernameValue = string;
class Username extends ValueObject<UsernameValue> {
  // Must implement the validate method
  validate(value: UsernameValue): ValidationResult {
    if (value.length < 3 || value.length > 30) {
      return false;
    }
    return true;
  }
}

expect(new Username('john_lennon').value).toBe('john_lennon');
```

When instantiated with a valid value, the value can be accessed via the `value` property. If the provided value fails validation, an error is thrown:

```ts
const username = new Username('john_lennon');
expect(username.value).toBe('john_lennon');

const invalidName = '';
expect(() => new Username(invalidName)).toThrow(ArgumentInvalidError);
```

Next, we’ll design the chip stack as a value object. The chip stack has two properties: balance and bet. We use `ChipCount` for these properties’ values, encapsulating domain invariants in `ChipCount` so we don’t need to worry about whether they are positive integers. Additionally, we define behaviors using `evolve` to update their values:

> **Tip**: The `evolve` method uses [Immer](https://immerjs.github.io/immer/) for updates, so you’ll see it accepts parameters like `(draft) => { draft.someProps = 'new value' }`. For value objects with a domain primitive value, you can directly pass the domain primitive value.

```ts
type ChipCountValue = number;
class ChipCount extends ValueObject<ChipCountValue> {
  add(count: ChipCount): ChipCount {
    return this.evolve(this.value + count.value);
  }

  subtract(count: ChipCount): ChipCount {
    if (count.value > this.value) {
      throw new DddError('Not enough chips');
    }
    return this.evolve(this.value - count.value);
  }

  validate(value: ChipCountValue): ValidationResult {
    if (value < 0 || !Number.isInteger(value)) {
      return false;
    }
    return true;
  }
}

type StackValue = {
  balance: ChipCount;
  bet: ChipCount;
};
class Stack extends ValueObject<StackValue> {
  raise(count: ChipCount): Stack {
    if (this.value.balance.value < count.value) {
      throw new DddError('Not enough balance');
    }
    // Use a recipe function when the value is not a domain primitive
    return this.evolve((draft) => {
      draft.balance = this.value.balance.subtract(count);
      draft.bet = this.value.bet.add(count);
    });
  }

  win(count: ChipCount): Stack {
    return this.evolve((draft) => {
      draft.balance = this.value.balance.add(count);
      draft.bet = new ChipCount(0);
    });
  }

  pay(): Stack {
    return this.evolve((draft) => {
      draft.bet = new ChipCount(0);
    });
  }

  validate(value: StackValue): ValidationResult {
    if (
      !(value.balance instanceof ChipCount) ||
      !(value.bet instanceof ChipCount)
    ) {
      return false;
    }
    return true;
  }
}
```

Note that this library designs all domain objects as immutable, so `evolve` returns a new value object instead of modifying the existing one. This ensures domain objects always adhere to domain invariants, as the instantiation process invokes the `validate` method. Whether creating, restoring from persistence, or using `evolve`, you must maintain domain invariants, or an error should be thrown.

You can use the `equals` method to compare whether two value objects have the same value:

```ts
const chipCount = new ChipCount(100);
const updatedChipCount = chipCount.add(0);
expect(updatedChipCount).not.toBe(chipCount);
expect(updatedChipCount.equals(chipCount)).toBe(true);
```

### Entities/Aggregate Roots

Now, it’s time to design the player object. A player has a unique identifier and should be designed as an entity, not a value object. In a poker game, a player must maintain domain invariants for its internal state, perform actions like raising or calling, and respond to external events by updating its state, acting like a gateway. Thus, we design it as an aggregate root.

An aggregate root requires defining an ID:

```ts
class UUID extends EntityId<string> {
  // Must implement the rawId getter
  get rawId(): string {
    return this.value;
  }

  // ... Implementation details ...
}

type PlayerProps = {
  id: UUID;
  username: Username;
  stack: Stack;
  folded: boolean;
};
class Player extends AggregateRoot<PlayerProps, UUID> {
  // Must implement the id getter
  get id(): UUID {
    return this.props.id;
  }

  fold() {
    return this.evolve((draft) => {
      draft.folded = true;
    });
  }

  validate(props: PlayerProps): ValidationResult {
    // ... Implementation details ...
  }
}
```

Access entity/aggregate root properties via `props`. The `equals` method only compares whether the `id` is the same, not the properties.

```ts
const playerProps = {
  id: new UUID(randomUUID()),
  username: new Username('john_lennon'),
  stack: new Stack({
    balance: new ChipCount(100),
    bet: new ChipCount(0),
  }),
  folded: false,
};
const player = new Player(playerProps);

const updatedPlayer = player.fold();

expect(player.props).toEqual(playerProps);
expect(player.equals(updatedPlayer)).toBe(true);
```

### Domain Events

In the game, a player’s actions must be communicated to other players to enable subsequent actions, so we define domain events:

> **Tip**: To ensure domain events can be easily passed between services, such as through a message queue system, their properties should remain serializable. Thus, we pass a plain string instead of a value object as the aggregate root ID.

```ts
class PlayerFolded extends DomainEvent {}
class PlayerChecked extends DomainEvent {}

type PlayerRaisedPayload = {
  amount: number;
};
class PlayerRaised extends DomainEvent<PlayerRaisedPayload> {
  constructor(aggregateId: string, amount: number) {
    super({
      aggregateId,
      amount,
    });
  }
}
```

Next, incorporate them into player behaviors:

```ts
class Player extends AggregateRoot<PlayerProps, UUID> {
  // ... Implementation details ...

  fold() {
    const event = new PlayerFolded(this.id.rawId);
    return this.evolve((draft) => {
      draft.folded = true;
    }).addEvent(event);
  }

  check() {
    const event = new PlayerChecked(this.id.rawId);
    return this.addEvent(event);
  }

  raise(count: ChipCount) {
    const event = new PlayerRaised(this.id.rawId, count.value);
    return this.evolve((draft) => {
      draft.stack = this.props.stack.raise(count);
    }).addEvent(event);
  }

  // ... Implementation details ...
}
```

When domain events are created alongside aggregate root behaviors and are “confirmed” (e.g., successfully persisted), the aggregate root can publish its collected domain events to the event system:

```ts
const playerProps = {
  // ... Implementation properties ...
};
let player = new Player(playerProps);
player = player.fold();
player.events; // [PlayerFolded]

// Persist state
await playerRepository.save(player);
// Publish domain events
player.publishEvents(eventEmitter);
```

### toJSON Method

For data persistence, remote calls, or responding to clients, domain objects often need to be converted to a serializable format. The `toJSON` method recursively converts values/properties into a JSON object:

> **Tip**: Avoid exposing domain models directly to external applications. Instead, convert them to Data Transfer Objects (DTOs) or View Models.

```ts
const playerProps = {
  id: new UUID('5d56961c-7794-47f5-9332-d96997351069'),
  username: new Username('john_lennon'),
  stack: new Stack({
    balance: new ChipCount(100),
    bet: new ChipCount(0),
  }),
  folded: false,
};
const player = new Player(playerProps);
const expectedJSON = {
  id: '5d56961c-7794-47f5-9332-d96997351069',
  username: 'john_lennon',
  stack: {
    balance: 100,
    bet: 0,
  },
  folded: false,
};

expect(player.toJSON()).toEqual(expectedJSON);
```
