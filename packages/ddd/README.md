English | [繁體中文](https://github.com/cdziv/devkit/blob/main/packages/ddd/README.zh-tw.md)

# Introduction

`@cdziv/devkit-ddd` assists you in implementing Domain-Driven Design (DDD) in your code, helping you build applications with clear domain knowledge, readability, maintainability, and scalability. It does not depend on any frameworks or ORMs and can be used in your application as needed.

> **Tip**: This documentation assumes you have a basic understanding of DDD. If you are not yet familiar with DDD or unsure whether to adopt it in your application, [Eric Evans' _Domain-Driven Design_](https://www.domainlanguage.com/ddd/) is a great starting point.

## Quick Start

In this section, we will use the core features of this library to implement a simple poker game example at the domain layer.

### Installation

```bash
npm install @cdziv/devkit-ddd
```

### Value Object

First, a player needs a username and a chip stack. We will design the username as a value object:

```ts
// Create a value object with a DomainPrimitive value
type UsernameValue = string;
class Username extends ValueObject<UsernameValue> {
  // Must implement the validation method
  validate(value: UsernameValue): ValidationResult {
    if (value.length < 3 || value.length > 30) {
      return false;
    }
    return true;
  }
}

expect(new Username('john_lennon').value).toBe('john_lennon');
```

When instantiating with a valid value, the value can be accessed via the `value` property. If the provided value fails validation, an error will be thrown:

```ts
const username = new Username('john_lennon');
expect(username.value).toBe('john_lennon');

const invalidName = '';
expect(() => new Username(invalidName)).toThrow(ArgumentInvalidError);
```

Next, we will design the chip stack as a value object. The chip stack has two properties: balance and bet. We use `ChipCount` for these properties' values, encapsulating the domain invariant logic within `ChipCount`, so we don’t need to worry about whether they are positive integers. Additionally, we define some behaviors using `evolve` to update their values:

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
    // Another usage of evolve
    return this.evolve((originalValue) => originalValue - count.value);
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
    // Another usage of evolve
    return this.evolve((originalValue) => ({
      balance: originalValue.balance.subtract(count),
      bet: originalValue.bet.add(count),
    }));
  }

  win(count: ChipCount): Stack {
    // Another usage of evolve
    return this.evolve({
      balance: this.value.balance.add(count),
      bet: new ChipCount(0),
    });
  }

  pay(): Stack {
    // Another usage of evolve
    return this.evolve('bet', new ChipCount(0));
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

Please note that this library designs all domain objects as immutable, so `evolve` returns a new value object instead of modifying the existing one. This ensures that domain objects always adhere to domain invariants, as the instantiation process calls the `validate` method. As long as you successfully create the object—whether through creation, persistence restoration, or via `evolve`—you must maintain its domain invariants, or an error should be thrown.

You can use the `equals` method to compare whether two value objects have the same value:

```ts
const chipCount = new ChipCount(100);
const updatedChipCount = chipCount.add(0);
expect(updatedChipCount).not.toBe(chipCount);
expect(updatedChipCount.equals(chipCount)).toBe(true);
```

### Entity / Aggregate Root

Now, it’s time to design the player object. A player has a unique identifier and should be designed as an entity rather than a value object. In a poker game, a player not only needs to maintain the domain invariants of its internal state but also perform actions like raising, calling, or waiting for external events to change its internal state, acting like a gateway. Therefore, we design it as an aggregate root.

An aggregate root needs to define an ID:

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
    return this.evolve('folded', true);
  }

  validate(props: PlayerProps): ValidationResult {
    // ... Implementation details ...
  }
}
```

The properties of an entity/aggregate root can be accessed via `props`, while the `equals` method only compares whether the `id` is the same, without deeply comparing the properties.

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

expect(player).toEqual(playerProps);
expect(player.equals(updatedPlayer)).toBe(true);
```

### Domain Event

In the game, a player’s actions need to be received by other players to proceed with subsequent actions, so we define domain events:

> **Tip**: To make domain events easily transferable between services, such as through a message queue system, their properties should remain serializable. Therefore, we do not directly pass a value object as the aggregate root ID but instead use a plain string.

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

Next, we incorporate these events into the player’s behaviors:

```ts
class Player extends AggregateRoot<PlayerProps, UUID> {
  // ... Implementation details ...

  fold() {
    const event = new PlayerFolded(this.id.rawId);
    return this.evolve('folded', true).addEvent(event);
  }

  check() {
    const event = new PlayerChecked(this.id.rawId);
    return this.addEvent(event);
  }

  raise(count: ChipCount) {
    const event = new PlayerRaised(this.id.rawId, count.value);
    return this.evolve('stack', this.props.stack.raise(count)).addEvent(event);
  }

  // ... Implementation details ...
}
```

When domain events are created alongside aggregate root behaviors, they are collected within the aggregate root. Once the behavior is confirmed to have occurred—e.g., after successful persistence—the aggregate root can publish the collected domain events to the event system:

```ts
const playerProps = {
  // ... Property implementation ...
};
let player = new Player(playerProps);
player = player.fold();
player.events; // [PlayerFolded]

// Persist the state
await playerRepository.save(player);
// Publish domain events
player.publishEvents(eventEmitter);
```

### toJSON Method

Whether for data persistence, remote calls, or responding to clients, domain objects often need to be converted into a serializable format. The `toJSON` method recursively converts values/properties into a JSON object:

> **Tip**: You should avoid directly exposing domain models to external applications. Instead, convert them into Data Transfer Objects (DTOs) or View Models.

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
